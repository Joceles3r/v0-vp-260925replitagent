#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Construire un module complet de promotion VISUAL permettant aux porteurs/créateurs de promouvoir leurs projets sur les réseaux sociaux (YouTube, TikTok, Facebook). 
  Le système doit inclure:
  - Authentification des porteurs
  - Gestion des projets
  - Autorisation de diffusion sur les réseaux sociaux
  - Génération de liens de partage avec tracking UTM
  - Système de statistiques (vues, clics)
  - Système de récompenses (VISUpoints, badges)
  - Classement mensuel des ambassadeurs
  - Emplacements pour les clés API des réseaux sociaux (à fournir plus tard)

backend:
  - task: "Configuration et variables d'environnement"
    implemented: true
    working: true
    file: "/app/backend/.env, /app/backend/config.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Configuration complète avec emplacements pour toutes les clés API (YouTube, TikTok, Facebook). Variables JWT configurées."

  - task: "Modèles de données (Users, Projects, Authorizations, Stats)"
    implemented: true
    working: true
    file: "/app/backend/models.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Tous les modèles Pydantic créés: User, Project, SocialAuthorization, SocialStats, Leaderboard, etc."

  - task: "Système d'authentification JWT"
    implemented: true
    working: "NA"
    file: "/app/backend/auth.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Authentification avec JWT implémentée: register, login, token verification. À tester."

  - task: "Routes API d'authentification"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Routes /api/auth/register, /api/auth/login, /api/auth/me créées. À tester."

  - task: "Routes API de gestion des projets"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Routes CRUD projets: POST /api/projects, GET /api/projects, GET /api/projects/{id}. À tester."

  - task: "Service de gestion des réseaux sociaux"
    implemented: true
    working: true
    file: "/app/backend/social_service.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Service créé avec génération de liens UTM et mocks pour YouTube/TikTok/Facebook APIs (en attente des vraies clés)"

  - task: "Routes API de promotion sociale"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Routes complètes: authorize, revoke, get_links, get_stats, track_event. Attribution automatique du badge 'Ambassadeur VISUAL' et VISUpoints."

  - task: "Système de classement (Leaderboard)"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Route /api/leaderboard avec agrégation MongoDB. Calcul du top 20 des ambassadeurs."

  - task: "Route admin de publication"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Route /api/admin/publish créée (mock pour l'instant, en attente des vraies API keys)"

frontend:
  - task: "Context d'authentification React"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/context/AuthContext.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "AuthContext avec login, register, logout. Stockage du token dans localStorage."

  - task: "Services API frontend"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/services/api.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Tous les services API créés: projects, authorization, stats, leaderboard."

  - task: "Navigation et Navbar"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/components/Navbar.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Navbar avec affichage conditionnel selon authentification, VISUpoints, badges."

  - task: "Page de connexion"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Login.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Page de login avec formulaire et gestion des erreurs."

  - task: "Page d'inscription"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Register.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Page d'inscription avec validation des mots de passe."

  - task: "Page d'accueil"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Home.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Page d'accueil avec présentation du P.O.D.V., features, comment ça marche, récompenses."

  - task: "Tableau de bord porteur"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Dashboard.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Dashboard complet avec stats, badges, projets récents, présentation du P.O.D.V."

  - task: "Page de liste des projets"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Projects.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Liste des projets avec cartes cliquables et état vide."

  - task: "Page de création de projet"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/NewProject.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Formulaire de création avec titre, description, video_url, thumbnail_url."

  - task: "Page de détail du projet avec promotion sociale"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/ProjectDetail.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Page complète avec panneau d'autorisation, sélection des plateformes, génération de liens, affichage des stats, copie des liens, révocation."

  - task: "Page de classement"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Leaderboard.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Classement avec emojis de rangs, badges, récompenses affichées."

  - task: "Routes et routing React"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Toutes les routes configurées avec protection pour les routes authentifiées."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Backend: Tester toutes les routes API"
    - "Frontend: Tester le flow complet d'inscription/login"
    - "Frontend: Tester la création de projet et autorisation"
    - "Frontend: Tester l'affichage des liens et stats"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Module VISUAL Social Promotion construit au complet. Backend FastAPI avec MongoDB et Frontend React. Tous les emplacements pour les clés API sont configurés dans .env. Le système utilise des mocks pour les APIs YouTube/TikTok/Facebook en attendant les vraies clés. Prêt pour les tests complets."