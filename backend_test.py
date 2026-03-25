import requests
import sys
import json
import uuid
from datetime import datetime
import base64
import io

class BurgerNetzAPITester:
    def __init__(self, base_url="https://urbanfix-34.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.test_issue_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    test_headers.pop('Content-Type', None)
                    response = requests.post(url, files=files, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return response.json() if response.content else {}
                except:
                    return {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:100]}"
                
                self.log_test(name, False, error_msg)
                return {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        self.run_test("API Root", "GET", "api/", 200)
        
        # Test health endpoint
        self.run_test("Health Check", "GET", "api/health", 200)

    def test_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        
        # Generate unique test user
        timestamp = datetime.now().strftime("%H%M%S")
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "testpass123"
        }
        
        response = self.run_test(
            "User Registration",
            "POST",
            "api/auth/register",
            200,
            data=test_user
        )
        
        if response and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        print("\n🔍 Testing User Login...")
        
        # First register a user for login test
        timestamp = datetime.now().strftime("%H%M%S")
        register_data = {
            "name": f"Login Test User {timestamp}",
            "email": f"login{timestamp}@example.com",
            "password": "loginpass123"
        }
        
        # Register user
        register_response = self.run_test(
            "Register User for Login Test",
            "POST",
            "api/auth/register",
            200,
            data=register_data
        )
        
        if not register_response:
            return False
        
        # Now test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        login_response = self.run_test(
            "User Login",
            "POST",
            "api/auth/login",
            200,
            data=login_data
        )
        
        return bool(login_response and 'token' in login_response)

    def test_auth_me(self):
        """Test getting current user info"""
        print("\n🔍 Testing Auth Me Endpoint...")
        
        if not self.token:
            self.log_test("Auth Me", False, "No token available")
            return False
        
        response = self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200
        )
        
        return bool(response and 'id' in response)

    def test_issue_creation(self):
        """Test creating an issue"""
        print("\n🔍 Testing Issue Creation...")
        
        if not self.token:
            self.log_test("Issue Creation", False, "No token available")
            return False
        
        issue_data = {
            "title": "Test Pothole Report",
            "description": "A large pothole on Main Street causing traffic issues",
            "category": "pothole",
            "latitude": 52.52,
            "longitude": 13.405,
            "address": "Main Street, Berlin"
        }
        
        response = self.run_test(
            "Create Issue",
            "POST",
            "api/issues",
            200,
            data=issue_data
        )
        
        if response and 'id' in response:
            self.test_issue_id = response['id']
            return True
        return False

    def test_photo_upload(self):
        """Test photo upload for an issue"""
        print("\n🔍 Testing Photo Upload...")
        
        if not self.token or not self.test_issue_id:
            self.log_test("Photo Upload", False, "No token or issue ID available")
            return False
        
        # Create a simple test image (1x1 pixel PNG)
        test_image_data = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
        )
        
        files = {
            'photo': ('test.png', io.BytesIO(test_image_data), 'image/png')
        }
        
        response = self.run_test(
            "Upload Photo",
            "POST",
            f"api/issues/{self.test_issue_id}/photos",
            200,
            files=files
        )
        
        return bool(response and 'message' in response)

    def test_get_issues(self):
        """Test getting all issues"""
        print("\n🔍 Testing Get Issues...")
        
        # Test getting all issues (no auth required)
        response = self.run_test(
            "Get All Issues",
            "GET",
            "api/issues",
            200,
            headers={'Authorization': ''}  # Remove auth header
        )
        
        # Test with category filter
        self.run_test(
            "Get Issues by Category",
            "GET",
            "api/issues?category=pothole",
            200,
            headers={'Authorization': ''}
        )
        
        # Test with status filter
        self.run_test(
            "Get Issues by Status",
            "GET",
            "api/issues?status=pending",
            200,
            headers={'Authorization': ''}
        )
        
        return bool(response)

    def test_get_single_issue(self):
        """Test getting a specific issue"""
        print("\n🔍 Testing Get Single Issue...")
        
        if not self.test_issue_id:
            self.log_test("Get Single Issue", False, "No test issue ID available")
            return False
        
        response = self.run_test(
            "Get Single Issue",
            "GET",
            f"api/issues/{self.test_issue_id}",
            200,
            headers={'Authorization': ''}  # Remove auth header
        )
        
        return bool(response and 'id' in response)

    def test_update_issue(self):
        """Test updating an issue"""
        print("\n🔍 Testing Issue Update...")
        
        if not self.token or not self.test_issue_id:
            self.log_test("Update Issue", False, "No token or issue ID available")
            return False
        
        update_data = {
            "status": "in_progress"
        }
        
        response = self.run_test(
            "Update Issue Status",
            "PATCH",
            f"api/issues/{self.test_issue_id}",
            200,
            data=update_data
        )
        
        return bool(response and response.get('status') == 'in_progress')

    def test_analytics(self):
        """Test analytics endpoint"""
        print("\n🔍 Testing Analytics...")
        
        response = self.run_test(
            "Get Analytics",
            "GET",
            "api/analytics",
            200,
            headers={'Authorization': ''}  # Remove auth header
        )
        
        expected_fields = ['total_issues', 'by_category', 'by_status', 'recent_issues', 'monthly_trends']
        if response:
            for field in expected_fields:
                if field not in response:
                    self.log_test(f"Analytics - {field} field", False, f"Missing field: {field}")
                else:
                    self.log_test(f"Analytics - {field} field", True)
        
        return bool(response)

    def test_delete_issue(self):
        """Test deleting an issue"""
        print("\n🔍 Testing Issue Deletion...")
        
        if not self.token or not self.test_issue_id:
            self.log_test("Delete Issue", False, "No token or issue ID available")
            return False
        
        response = self.run_test(
            "Delete Issue",
            "DELETE",
            f"api/issues/{self.test_issue_id}",
            200
        )
        
        return bool(response and 'message' in response)

    def test_invalid_endpoints(self):
        """Test error handling for invalid requests"""
        print("\n🔍 Testing Error Handling...")
        
        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "api/auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrongpass"}
        )
        
        # Test accessing protected endpoint without auth
        self.run_test(
            "Protected Endpoint Without Auth",
            "POST",
            "api/issues",
            401,
            data={"title": "test"},
            headers={'Authorization': ''}
        )
        
        # Test non-existent issue
        self.run_test(
            "Non-existent Issue",
            "GET",
            "api/issues/non-existent-id",
            404,
            headers={'Authorization': ''}
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting BurgerNetz API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test basic endpoints
        self.test_health_endpoints()
        
        # Test authentication
        if self.test_user_registration():
            self.test_auth_me()
        
        self.test_user_login()
        
        # Test issue management
        if self.test_issue_creation():
            self.test_photo_upload()
            self.test_get_single_issue()
            self.test_update_issue()
        
        self.test_get_issues()
        self.test_analytics()
        
        # Test error handling
        self.test_invalid_endpoints()
        
        # Clean up - delete test issue
        if self.test_issue_id:
            self.test_delete_issue()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = BurgerNetzAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())