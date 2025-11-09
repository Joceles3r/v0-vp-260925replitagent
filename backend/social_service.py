from typing import Dict, List, Optional
from models import SocialPlatform, VideoExcerpt
from config import settings
import logging

logger = logging.getLogger(__name__)

class SocialMediaService:
    """Service pour gérer les publications sur les réseaux sociaux"""
    
    def __init__(self):
        self.youtube_api_key = settings.YOUTUBE_API_KEY
        self.tiktok_api_key = settings.TIKTOK_API_KEY
        self.facebook_access_token = settings.FACEBOOK_ACCESS_TOKEN
    
    def generate_share_links(self, project_id: str, platforms: List[SocialPlatform]) -> Dict[str, str]:
        """Génère les liens de partage avec tracking UTM"""
        base_url = settings.VISUAL_BASE_URL
        links = {}
        
        for platform in platforms:
            url = f"{base_url}/project/{project_id}"
            url += f"?utm_source={platform.value}"
            url += "&utm_medium=official_social"
            url += f"&utm_campaign=project_{project_id}"
            links[platform.value] = url
        
        return links
    
    def get_video_specs(self, platform: SocialPlatform) -> VideoExcerpt:
        """Retourne les spécifications vidéo pour chaque plateforme"""
        specs = {
            SocialPlatform.YOUTUBE: VideoExcerpt(
                platform=platform,
                duration=60,
                aspect_ratio="16:9",
                format="mp4"
            ),
            SocialPlatform.TIKTOK: VideoExcerpt(
                platform=platform,
                duration=30,
                aspect_ratio="9:16",
                format="mp4"
            ),
            SocialPlatform.FACEBOOK: VideoExcerpt(
                platform=platform,
                duration=45,
                aspect_ratio="1:1",
                format="mp4"
            )
        }
        return specs.get(platform)
    
    async def publish_to_youtube(self, video_path: str, title: str, description: str, project_id: str) -> Dict:
        """Publie une vidéo sur YouTube (MOCK pour l'instant)"""
        if not self.youtube_api_key or self.youtube_api_key == "your-youtube-api-key-here":
            logger.warning("YouTube API key not configured. Using mock response.")
            return {
                "success": True,
                "mock": True,
                "video_id": f"mock_youtube_{project_id}",
                "url": f"{settings.VISUAL_OFFICIAL_YOUTUBE}/video/{project_id}",
                "message": "Mock publication - Clé API YouTube non configurée"
            }
        
        # TODO: Implémenter la vraie intégration YouTube API v3
        logger.info(f"Publishing to YouTube: {title}")
        return {
            "success": True,
            "video_id": "real_youtube_id",
            "url": f"{settings.VISUAL_OFFICIAL_YOUTUBE}/video/real_id"
        }
    
    async def publish_to_tiktok(self, video_path: str, title: str, description: str, project_id: str) -> Dict:
        """Publie une vidéo sur TikTok (MOCK pour l'instant)"""
        if not self.tiktok_api_key or self.tiktok_api_key == "your-tiktok-api-key-here":
            logger.warning("TikTok API key not configured. Using mock response.")
            return {
                "success": True,
                "mock": True,
                "video_id": f"mock_tiktok_{project_id}",
                "url": f"{settings.VISUAL_OFFICIAL_TIKTOK}/video/{project_id}",
                "message": "Mock publication - Clé API TikTok non configurée"
            }
        
        # TODO: Implémenter la vraie intégration TikTok Upload API
        logger.info(f"Publishing to TikTok: {title}")
        return {
            "success": True,
            "video_id": "real_tiktok_id",
            "url": f"{settings.VISUAL_OFFICIAL_TIKTOK}/video/real_id"
        }
    
    async def publish_to_facebook(self, video_path: str, title: str, description: str, project_id: str) -> Dict:
        """Publie une vidéo sur Facebook (MOCK pour l'instant)"""
        if not self.facebook_access_token or self.facebook_access_token == "your-facebook-access-token-here":
            logger.warning("Facebook access token not configured. Using mock response.")
            return {
                "success": True,
                "mock": True,
                "video_id": f"mock_facebook_{project_id}",
                "url": f"{settings.VISUAL_OFFICIAL_FACEBOOK}/video/{project_id}",
                "message": "Mock publication - Token Facebook non configuré"
            }
        
        # TODO: Implémenter la vraie intégration Meta Graph API
        logger.info(f"Publishing to Facebook: {title}")
        return {
            "success": True,
            "video_id": "real_facebook_id",
            "url": f"{settings.VISUAL_OFFICIAL_FACEBOOK}/video/real_id"
        }
    
    async def publish_to_platform(self, platform: SocialPlatform, video_path: str, title: str, description: str, project_id: str) -> Dict:
        """Publie sur la plateforme spécifiée"""
        if platform == SocialPlatform.YOUTUBE:
            return await self.publish_to_youtube(video_path, title, description, project_id)
        elif platform == SocialPlatform.TIKTOK:
            return await self.publish_to_tiktok(video_path, title, description, project_id)
        elif platform == SocialPlatform.FACEBOOK:
            return await self.publish_to_facebook(video_path, title, description, project_id)
        else:
            return {"success": False, "error": "Platform not supported"}

social_service = SocialMediaService()