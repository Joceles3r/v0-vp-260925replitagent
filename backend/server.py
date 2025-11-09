from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import timedelta
from typing import List, Optional
import os
import logging
from pathlib import Path

# Import des modules locaux
from config import settings
from models import (
    UserCreate, UserLogin, User, UserResponse, Token,
    ProjectCreate, Project,
    AuthorizeShareRequest, AuthorizeShareResponse, SocialAuthorization,
    SocialStats, TrackEventRequest, EventType,
    LeaderboardEntry, SocialPlatform
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, security
)
from social_service import social_service

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = settings.MONGO_URL
client = AsyncIOMotorClient(mongo_url)
db = client[settings.DB_NAME]

# Create the main app
app = FastAPI(title="VISUAL Social Promotion API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Dependency pour obtenir la base de données
async def get_db():
    return db

# Dependency pour obtenir l'utilisateur actuel
async def get_current_user_dep(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return await get_current_user(credentials, db)

# ============================================================================
# AUTH ROUTES
# ============================================================================

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Inscription d'un nouveau porteur/créateur"""
    # Vérifier si l'email existe déjà
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email déjà enregistré"
        )
    
    # Créer le nouvel utilisateur
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    return UserResponse(**user.model_dump())

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Connexion d'un porteur"""
    user_data = await db.users.find_one({"email": credentials.email})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    
    user = User(**user_data)
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user_dep)):
    """Obtenir le profil de l'utilisateur connecté"""
    return UserResponse(**current_user.model_dump())

# ============================================================================
# PROJECT ROUTES
# ============================================================================

@api_router.post("/projects", response_model=Project)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(lambda creds=Depends(security): get_current_user(creds, db))
):
    """Créer un nouveau projet"""
    project = Project(
        user_id=current_user.id,
        **project_data.model_dump()
    )
    
    project_dict = project.model_dump()
    project_dict['created_at'] = project_dict['created_at'].isoformat()
    project_dict['updated_at'] = project_dict['updated_at'].isoformat()
    
    await db.projects.insert_one(project_dict)
    
    return project

@api_router.get("/projects", response_model=List[Project])
async def get_projects(
    current_user: User = Depends(lambda creds=Depends(security): get_current_user(creds, db))
):
    """Obtenir tous les projets de l'utilisateur"""
    projects = await db.projects.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for project in projects:
        if isinstance(project.get('created_at'), str):
            from datetime import datetime
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if isinstance(project.get('updated_at'), str):
            from datetime import datetime
            project['updated_at'] = datetime.fromisoformat(project['updated_at'])
    
    return projects

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(
    project_id: str,
    current_user: User = Depends(lambda creds=Depends(security): get_current_user(creds, db))
):
    """Obtenir un projet spécifique"""
    project_data = await db.projects.find_one({"id": project_id, "user_id": current_user.id}, {"_id": 0})
    
    if not project_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    if isinstance(project_data.get('created_at'), str):
        from datetime import datetime
        project_data['created_at'] = datetime.fromisoformat(project_data['created_at'])
    if isinstance(project_data.get('updated_at'), str):
        from datetime import datetime
        project_data['updated_at'] = datetime.fromisoformat(project_data['updated_at'])
    
    return Project(**project_data)

# ============================================================================
# SOCIAL PROMOTION ROUTES
# ============================================================================

@api_router.post("/social/authorize", response_model=AuthorizeShareResponse)
async def authorize_share(
    request: Request,
    auth_request: AuthorizeShareRequest,
    current_user: User = Depends(lambda creds=Depends(security): get_current_user(creds, db))
):
    """
    Autoriser la diffusion d'un projet sur les réseaux sociaux VISUAL.
    
    Cette route :
    1. Enregistre l'autorisation de l'utilisateur
    2. Initialise les statistiques pour chaque plateforme
    3. Génère les liens de partage avec tracking UTM
    4. Attribue le badge 'Ambassadeur VISUAL' si premier projet autorisé
    5. Récompense avec des VISUpoints bonus
    """
    # Vérifier que le projet appartient à l'utilisateur
    project = await db.projects.find_one({"id": auth_request.project_id, "user_id": current_user.id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Récupérer l'IP du client
    client_ip = request.client.host if request.client else None
    
    # Créer ou mettre à jour l'autorisation
    existing_auth = await db.social_authorizations.find_one({
        "user_id": current_user.id,
        "project_id": auth_request.project_id
    })
    
    if existing_auth:
        # Mettre à jour l'autorisation existante
        from datetime import datetime
        await db.social_authorizations.update_one(
            {"id": existing_auth["id"]},
            {"$set": {
                "platforms": [p.value for p in auth_request.platforms],
                "authorized_at": datetime.utcnow().isoformat(),
                "authorized_ip": client_ip,
                "revoked": False,
                "revoked_at": None
            }}
        )
        auth_id = existing_auth["id"]
    else:
        # Créer une nouvelle autorisation
        authorization = SocialAuthorization(
            user_id=current_user.id,
            project_id=auth_request.project_id,
            platforms=auth_request.platforms,
            authorized_ip=client_ip
        )
        
        auth_dict = authorization.model_dump()
        auth_dict['authorized_at'] = auth_dict['authorized_at'].isoformat()
        auth_dict['platforms'] = [p.value for p in auth_request.platforms]
        
        await db.social_authorizations.insert_one(auth_dict)
        auth_id = authorization.id
    
    # Initialiser les statistiques pour chaque plateforme
    for platform in auth_request.platforms:
        existing_stats = await db.social_stats.find_one({
            "project_id": auth_request.project_id,
            "platform": platform.value
        })
        
        if not existing_stats:
            stats = SocialStats(
                project_id=auth_request.project_id,
                platform=platform
            )
            
            stats_dict = stats.model_dump()
            stats_dict['last_updated_at'] = stats_dict['last_updated_at'].isoformat()
            stats_dict['platform'] = platform.value
            
            await db.social_stats.insert_one(stats_dict)
    
    # Attribuer le badge "Ambassadeur VISUAL" si c'est la première autorisation
    if not existing_auth:
        if "Ambassadeur VISUAL" not in current_user.badges:
            await db.users.update_one(
                {"id": current_user.id},
                {"$push": {"badges": "Ambassadeur VISUAL"}, "$inc": {"visupoints": 100}}
            )
    
    # Générer les liens de partage
    links = social_service.generate_share_links(auth_request.project_id, auth_request.platforms)
    
    return AuthorizeShareResponse(
        project_id=auth_request.project_id,
        platforms=auth_request.platforms,
        links=links,
        message="Autorisation enregistrée avec succès. Vous avez reçu le badge 'Ambassadeur VISUAL' et 100 VISUpoints !"
    )

@api_router.post("/social/revoke")
async def revoke_authorization(
    project_id: str,
    current_user: User = Depends(lambda creds=Depends(security): get_current_user(creds, db))
):
    """Révoquer l'autorisation de diffusion pour un projet"""
    auth = await db.social_authorizations.find_one({
        "user_id": current_user.id,
        "project_id": project_id
    })
    
    if not auth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune autorisation trouvée pour ce projet"
        )
    
    from datetime import datetime
    await db.social_authorizations.update_one(
        {"id": auth["id"]},
        {"$set": {
            "revoked": True,
            "revoked_at": datetime.utcnow().isoformat()
        }}
    )
    
    return {"success": True, "message": "Autorisation révoquée avec succès"}

@api_router.get("/social/authorizations")
async def get_authorizations(
    current_user: User = Depends(lambda creds=Depends(security): get_current_user(creds, db))
):
    """Obtenir toutes les autorisations de l'utilisateur"""
    authorizations = await db.social_authorizations.find(
        {"user_id": current_user.id, "revoked": False},
        {"_id": 0}
    ).to_list(1000)
    
    return {"authorizations": authorizations}

@api_router.get("/social/links/{project_id}")
async def get_share_links(
    project_id: str,
    current_user: User = Depends(lambda creds=Depends(security): get_current_user(creds, db))
):
    """Obtenir les liens de partage pour un projet"""
    # Vérifier que le projet appartient à l'utilisateur
    project = await db.projects.find_one({"id": project_id, "user_id": current_user.id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier qu'une autorisation existe
    auth = await db.social_authorizations.find_one({
        "user_id": current_user.id,
        "project_id": project_id,
        "revoked": False
    })
    
    if not auth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune autorisation active pour ce projet"
        )
    
    # Générer les liens
    platforms = [SocialPlatform(p) for p in auth["platforms"]]
    links = social_service.generate_share_links(project_id, platforms)
    
    return {"project_id": project_id, "links": links}

@api_router.get("/social/stats/{project_id}")
async def get_project_stats(
    project_id: str,
    current_user: User = Depends(lambda creds=Depends(security): get_current_user(creds, db))
):
    """Obtenir les statistiques de promotion d'un projet"""
    # Vérifier que le projet appartient à l'utilisateur
    project = await db.projects.find_one({"id": project_id, "user_id": current_user.id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Récupérer les statistiques
    stats = await db.social_stats.find({"project_id": project_id}, {"_id": 0}).to_list(10)
    
    total_views = sum(s.get("views", 0) for s in stats)
    total_clicks = sum(s.get("clicks", 0) for s in stats)
    
    return {
        "project_id": project_id,
        "total_views": total_views,
        "total_clicks": total_clicks,
        "by_platform": stats
    }

@api_router.post("/social/track")
async def track_event(event: TrackEventRequest):
    """
    Tracker un événement (vue ou clic) sur un lien de partage.
    Cette route peut être appelée publiquement (pas d'authentification requise)
    """
    # Mettre à jour les statistiques
    stats = await db.social_stats.find_one({
        "project_id": event.project_id,
        "platform": event.platform.value
    })
    
    if not stats:
        # Créer les stats si elles n'existent pas
        new_stats = SocialStats(
            project_id=event.project_id,
            platform=event.platform
        )
        stats_dict = new_stats.model_dump()
        stats_dict['last_updated_at'] = stats_dict['last_updated_at'].isoformat()
        stats_dict['platform'] = event.platform.value
        
        if event.event_type == EventType.VIEW:
            stats_dict['views'] = 1
        else:
            stats_dict['clicks'] = 1
        
        await db.social_stats.insert_one(stats_dict)
    else:
        # Incrémenter les stats existantes
        from datetime import datetime
        field_to_update = "views" if event.event_type == EventType.VIEW else "clicks"
        await db.social_stats.update_one(
            {"id": stats["id"]},
            {
                "$inc": {field_to_update: 1},
                "$set": {"last_updated_at": datetime.utcnow().isoformat()}
            }
        )
    
    return {"success": True, "message": f"{event.event_type.value} tracked successfully"}

@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard():
    """
    Obtenir le classement mensuel des porteurs les plus actifs.
    Récompenses :
    - 1er : +500 VISUpoints
    - 2e-5e : +200 VISUpoints
    - 6e-10e : +100 VISUpoints
    """
    # Agréger les statistiques par utilisateur
    pipeline = [
        {
            "$lookup": {
                "from": "projects",
                "localField": "project_id",
                "foreignField": "id",
                "as": "project"
            }
        },
        {"$unwind": "$project"},
        {
            "$group": {
                "_id": "$project.user_id",
                "total_views": {"$sum": "$views"},
                "total_clicks": {"$sum": "$clicks"}
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "id",
                "as": "user"
            }
        },
        {"$unwind": "$user"},
        {
            "$project": {
                "user_id": "$_id",
                "full_name": "$user.full_name",
                "visupoints": "$user.visupoints",
                "badges": "$user.badges",
                "total_views": 1,
                "total_clicks": 1
            }
        },
        {"$sort": {"total_views": -1, "total_clicks": -1}},
        {"$limit": 20}
    ]
    
    results = await db.social_stats.aggregate(pipeline).to_list(20)
    
    leaderboard = []
    for rank, entry in enumerate(results, start=1):
        leaderboard.append(LeaderboardEntry(
            user_id=entry["user_id"],
            full_name=entry["full_name"],
            visupoints=entry["visupoints"],
            total_views=entry["total_views"],
            total_clicks=entry["total_clicks"],
            badges=entry.get("badges", []),
            rank=rank
        ))
    
    return leaderboard

# ============================================================================
# ADMIN ROUTES (Publication sur les réseaux)
# ============================================================================

@api_router.post("/admin/publish")
async def publish_to_social(
    project_id: str,
    platforms: List[SocialPlatform],
    current_user: User = Depends(lambda creds=Depends(security): get_current_user(creds, db))
):
    """
    [ADMIN] Publier un projet sur les réseaux sociaux officiels VISUAL.
    Cette route sera utilisée pour déclencher la publication automatique.
    """
    # Vérifier que le projet existe et est autorisé
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    auth = await db.social_authorizations.find_one({
        "project_id": project_id,
        "revoked": False
    })
    
    if not auth:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aucune autorisation active pour ce projet"
        )
    
    # Publier sur chaque plateforme
    results = {}
    for platform in platforms:
        if platform.value not in auth["platforms"]:
            results[platform.value] = {"success": False, "error": "Platform not authorized"}
            continue
        
        # Pour l'instant, on utilise des mocks (les vraies API seront implémentées plus tard)
        result = await social_service.publish_to_platform(
            platform=platform,
            video_path=f"/tmp/{project_id}_{platform.value}.mp4",  # Placeholder
            title=project["title"],
            description=project["description"],
            project_id=project_id
        )
        results[platform.value] = result
    
    return {
        "project_id": project_id,
        "results": results,
        "message": "Publication effectuée (mock pour l'instant - API keys à configurer)"
    }

# ============================================================================
# Root route
# ============================================================================

@api_router.get("/")
async def root():
    return {
        "message": "VISUAL Social Promotion API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.CORS_ORIGINS.split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
