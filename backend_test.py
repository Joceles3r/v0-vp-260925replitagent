#!/usr/bin/env python3
"""
Test complet du backend VISUAL Social Promotion
Tests selon les spécifications de la review request
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
BASE_URL = "https://github-connector-5.preview.emergentagent.com/api"
TEST_USER = {
    "email": "test@visual.com",
    "password": "test123",
    "full_name": "Test User"
}

class VisualAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.user_id = None
        self.project_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        default_headers = {"Content-Type": "application/json"}
        
        if self.token:
            default_headers["Authorization"] = f"Bearer {self.token}"
        
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=default_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request error for {method} {url}: {e}")
            raise
    
    def test_auth_register(self):
        """Test 1: POST /api/auth/register"""
        try:
            response = self.make_request("POST", "/auth/register", TEST_USER)
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                if "id" in data and "email" in data:
                    self.user_id = data["id"]
                    self.log_test("Auth Register", True, f"User created with ID: {self.user_id}", data)
                else:
                    self.log_test("Auth Register", False, "Missing required fields in response", data)
            elif response.status_code == 400 and "déjà enregistré" in response.text:
                # User already exists, that's ok for testing
                self.log_test("Auth Register", True, "User already exists (expected for repeated tests)")
            else:
                self.log_test("Auth Register", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Auth Register", False, f"Exception: {str(e)}")
    
    def test_auth_login(self):
        """Test 2: POST /api/auth/login"""
        try:
            login_data = {
                "email": TEST_USER["email"],
                "password": TEST_USER["password"]
            }
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "token_type" in data:
                    self.token = data["access_token"]
                    self.log_test("Auth Login", True, "Token received successfully", {"token_type": data["token_type"]})
                else:
                    self.log_test("Auth Login", False, "Missing token in response", data)
            else:
                self.log_test("Auth Login", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Auth Login", False, f"Exception: {str(e)}")
    
    def test_auth_me(self):
        """Test 3: GET /api/auth/me"""
        if not self.token:
            self.log_test("Auth Me", False, "No token available")
            return
        
        try:
            response = self.make_request("GET", "/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "email" in data and "full_name" in data:
                    self.user_id = data["id"]
                    self.log_test("Auth Me", True, f"Profile retrieved for user: {data['full_name']}", data)
                else:
                    self.log_test("Auth Me", False, "Missing required profile fields", data)
            else:
                self.log_test("Auth Me", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Auth Me", False, f"Exception: {str(e)}")
    
    def test_create_project(self):
        """Test 4: POST /api/projects"""
        if not self.token:
            self.log_test("Create Project", False, "No token available")
            return
        
        try:
            project_data = {
                "title": "Mon Premier Projet",
                "description": "Description test"
            }
            response = self.make_request("POST", "/projects", project_data)
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                if "id" in data and "title" in data:
                    self.project_id = data["id"]
                    self.log_test("Create Project", True, f"Project created with ID: {self.project_id}", data)
                else:
                    self.log_test("Create Project", False, "Missing required fields in response", data)
            else:
                self.log_test("Create Project", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Create Project", False, f"Exception: {str(e)}")
    
    def test_get_projects(self):
        """Test 5: GET /api/projects"""
        if not self.token:
            self.log_test("Get Projects", False, "No token available")
            return
        
        try:
            response = self.make_request("GET", "/projects")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Projects", True, f"Retrieved {len(data)} projects", {"count": len(data)})
                else:
                    self.log_test("Get Projects", False, "Response is not a list", data)
            else:
                self.log_test("Get Projects", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Projects", False, f"Exception: {str(e)}")
    
    def test_get_project_by_id(self):
        """Test 6: GET /api/projects/{id}"""
        if not self.token or not self.project_id:
            self.log_test("Get Project By ID", False, "No token or project_id available")
            return
        
        try:
            response = self.make_request("GET", f"/projects/{self.project_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["id"] == self.project_id:
                    self.log_test("Get Project By ID", True, f"Project details retrieved: {data['title']}", data)
                else:
                    self.log_test("Get Project By ID", False, "Project ID mismatch", data)
            else:
                self.log_test("Get Project By ID", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Project By ID", False, f"Exception: {str(e)}")
    
    def test_social_authorize(self):
        """Test 7: POST /api/social/authorize"""
        if not self.token or not self.project_id:
            self.log_test("Social Authorize", False, "No token or project_id available")
            return
        
        try:
            auth_data = {
                "project_id": self.project_id,
                "platforms": ["youtube", "tiktok", "facebook"]
            }
            response = self.make_request("POST", "/social/authorize", auth_data)
            
            if response.status_code == 200:
                data = response.json()
                if "project_id" in data and "platforms" in data and "links" in data:
                    # Vérifier que les liens contiennent des UTM tracking
                    links_valid = True
                    for platform, link in data["links"].items():
                        if "utm_source" not in link or "utm_campaign" not in link:
                            links_valid = False
                            break
                    
                    if links_valid:
                        self.log_test("Social Authorize", True, "Authorization successful with UTM tracking", data)
                    else:
                        self.log_test("Social Authorize", False, "Links missing UTM parameters", data)
                else:
                    self.log_test("Social Authorize", False, "Missing required fields in response", data)
            else:
                self.log_test("Social Authorize", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Social Authorize", False, f"Exception: {str(e)}")
    
    def test_get_share_links(self):
        """Test 8: GET /api/social/links/{project_id}"""
        if not self.token or not self.project_id:
            self.log_test("Get Share Links", False, "No token or project_id available")
            return
        
        try:
            response = self.make_request("GET", f"/social/links/{self.project_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "project_id" in data and "links" in data:
                    self.log_test("Get Share Links", True, f"Share links retrieved for project", data)
                else:
                    self.log_test("Get Share Links", False, "Missing required fields", data)
            else:
                self.log_test("Get Share Links", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Share Links", False, f"Exception: {str(e)}")
    
    def test_get_project_stats_initial(self):
        """Test 9: GET /api/social/stats/{project_id} - Initial stats"""
        if not self.token or not self.project_id:
            self.log_test("Get Project Stats (Initial)", False, "No token or project_id available")
            return
        
        try:
            response = self.make_request("GET", f"/social/stats/{self.project_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "project_id" in data and "total_views" in data and "total_clicks" in data:
                    # Initial stats should be 0
                    if data["total_views"] == 0 and data["total_clicks"] == 0:
                        self.log_test("Get Project Stats (Initial)", True, "Initial stats are correctly at 0", data)
                    else:
                        self.log_test("Get Project Stats (Initial)", True, f"Stats: {data['total_views']} views, {data['total_clicks']} clicks", data)
                else:
                    self.log_test("Get Project Stats (Initial)", False, "Missing required fields", data)
            else:
                self.log_test("Get Project Stats (Initial)", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Project Stats (Initial)", False, f"Exception: {str(e)}")
    
    def test_get_authorizations(self):
        """Test 10: GET /api/social/authorizations"""
        if not self.token:
            self.log_test("Get Authorizations", False, "No token available")
            return
        
        try:
            response = self.make_request("GET", "/social/authorizations")
            
            if response.status_code == 200:
                data = response.json()
                if "authorizations" in data:
                    self.log_test("Get Authorizations", True, f"Retrieved {len(data['authorizations'])} authorizations", data)
                else:
                    self.log_test("Get Authorizations", False, "Missing authorizations field", data)
            else:
                self.log_test("Get Authorizations", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Authorizations", False, f"Exception: {str(e)}")
    
    def test_track_events(self):
        """Test 11: POST /api/social/track - Simulate views and clicks"""
        if not self.project_id:
            self.log_test("Track Events", False, "No project_id available")
            return
        
        platforms = ["youtube", "tiktok", "facebook"]
        events = ["view", "click"]
        
        success_count = 0
        total_events = len(platforms) * len(events)
        
        for platform in platforms:
            for event_type in events:
                try:
                    track_data = {
                        "project_id": self.project_id,
                        "platform": platform,
                        "event_type": event_type
                    }
                    response = self.make_request("POST", "/social/track", track_data)
                    
                    if response.status_code == 200:
                        success_count += 1
                    else:
                        print(f"   Failed to track {event_type} for {platform}: {response.status_code}")
                        
                except Exception as e:
                    print(f"   Exception tracking {event_type} for {platform}: {str(e)}")
        
        if success_count == total_events:
            self.log_test("Track Events", True, f"Successfully tracked {success_count}/{total_events} events")
        else:
            self.log_test("Track Events", False, f"Only tracked {success_count}/{total_events} events")
    
    def test_get_project_stats_updated(self):
        """Test 12: GET /api/social/stats/{project_id} - Updated stats"""
        if not self.token or not self.project_id:
            self.log_test("Get Project Stats (Updated)", False, "No token or project_id available")
            return
        
        try:
            response = self.make_request("GET", f"/social/stats/{self.project_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "project_id" in data and "total_views" in data and "total_clicks" in data:
                    # Stats should be incremented after tracking
                    if data["total_views"] > 0 or data["total_clicks"] > 0:
                        self.log_test("Get Project Stats (Updated)", True, f"Stats updated: {data['total_views']} views, {data['total_clicks']} clicks", data)
                    else:
                        self.log_test("Get Project Stats (Updated)", False, "Stats not incremented after tracking", data)
                else:
                    self.log_test("Get Project Stats (Updated)", False, "Missing required fields", data)
            else:
                self.log_test("Get Project Stats (Updated)", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Project Stats (Updated)", False, f"Exception: {str(e)}")
    
    def test_leaderboard(self):
        """Test 13: GET /api/leaderboard"""
        try:
            response = self.make_request("GET", "/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our user is in the leaderboard
                    user_found = False
                    for entry in data:
                        if "user_id" in entry and entry["user_id"] == self.user_id:
                            user_found = True
                            break
                    
                    if user_found:
                        self.log_test("Leaderboard", True, f"User found in leaderboard with {len(data)} total entries", {"entries": len(data)})
                    else:
                        self.log_test("Leaderboard", True, f"Leaderboard retrieved with {len(data)} entries (user not yet ranked)", {"entries": len(data)})
                else:
                    self.log_test("Leaderboard", False, "Response is not a list", data)
            else:
                self.log_test("Leaderboard", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Leaderboard", False, f"Exception: {str(e)}")
    
    def test_social_revoke(self):
        """Test 14: POST /api/social/revoke"""
        if not self.token or not self.project_id:
            self.log_test("Social Revoke", False, "No token or project_id available")
            return
        
        try:
            revoke_data = {"project_id": self.project_id}
            response = self.make_request("POST", "/social/revoke", revoke_data)
            
            if response.status_code == 200:
                data = response.json()
                if "success" in data and data["success"]:
                    self.log_test("Social Revoke", True, "Authorization revoked successfully", data)
                else:
                    self.log_test("Social Revoke", False, "Revocation not successful", data)
            else:
                self.log_test("Social Revoke", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Social Revoke", False, f"Exception: {str(e)}")
    
    def test_verify_revocation(self):
        """Test 15: Verify authorization is revoked"""
        if not self.token:
            self.log_test("Verify Revocation", False, "No token available")
            return
        
        try:
            response = self.make_request("GET", "/social/authorizations")
            
            if response.status_code == 200:
                data = response.json()
                if "authorizations" in data:
                    # Should have no active authorizations after revocation
                    active_auths = [auth for auth in data["authorizations"] if not auth.get("revoked", False)]
                    if len(active_auths) == 0:
                        self.log_test("Verify Revocation", True, "No active authorizations found (revocation confirmed)")
                    else:
                        self.log_test("Verify Revocation", False, f"Still {len(active_auths)} active authorizations", data)
                else:
                    self.log_test("Verify Revocation", False, "Missing authorizations field", data)
            else:
                self.log_test("Verify Revocation", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Verify Revocation", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting VISUAL Social Promotion Backend Tests")
        print(f"📍 API URL: {self.base_url}")
        print("=" * 80)
        
        # Authentication tests
        print("\n🔐 AUTHENTICATION TESTS")
        self.test_auth_register()
        self.test_auth_login()
        self.test_auth_me()
        
        # Project tests
        print("\n📁 PROJECT TESTS")
        self.test_create_project()
        self.test_get_projects()
        self.test_get_project_by_id()
        
        # Social promotion tests
        print("\n📱 SOCIAL PROMOTION TESTS")
        self.test_social_authorize()
        self.test_get_share_links()
        self.test_get_project_stats_initial()
        self.test_get_authorizations()
        
        # Tracking tests
        print("\n📊 TRACKING TESTS")
        self.test_track_events()
        time.sleep(1)  # Small delay to ensure stats are updated
        self.test_get_project_stats_updated()
        
        # Leaderboard test
        print("\n🏆 LEADERBOARD TESTS")
        self.test_leaderboard()
        
        # Revocation tests
        print("\n🚫 REVOCATION TESTS")
        self.test_social_revoke()
        self.test_verify_revocation()
        
        # Summary
        print("\n" + "=" * 80)
        print("📋 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}: {result['details']}")
        
        print(f"\n🎯 Success Rate: {(passed/total)*100:.1f}%")
        
        return passed, total

if __name__ == "__main__":
    tester = VisualAPITester()
    passed, total = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if passed == total else 1)