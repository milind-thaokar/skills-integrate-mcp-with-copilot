from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


def reset_activities():
    activities.clear()
    activities.update(
        {
            "Chess Club": {
                "description": "Learn strategies and compete in chess tournaments",
                "schedule": "Fridays, 3:30 PM - 5:00 PM",
                "location": "Room 204",
                "category": "Sports",
                "max_participants": 12,
                "participants": [],
                "active": True,
            }
        }
    )


def test_get_activities_excludes_archived_activities():
    reset_activities()
    activities["Chess Club"]["active"] = False

    response = client.get("/activities")

    assert response.status_code == 200
    assert response.json() == {}


def test_admin_can_create_activity():
    reset_activities()

    response = client.post(
        "/activities",
        json={
            "name": "Photography Club",
            "description": "Learn photography techniques",
            "schedule": "Saturdays, 10:00 AM - 12:00 PM",
            "location": "Art Wing",
            "category": "Arts",
            "max_participants": 15,
        },
    )

    assert response.status_code == 201
    created = response.json()
    assert created["name"] == "Photography Club"
    assert created["active"] is True
    assert created["participants"] == []
    assert activities["Photography Club"]["category"] == "Arts"


def test_admin_can_update_activity():
    reset_activities()

    response = client.put(
        "/activities/Chess%20Club",
        json={
            "description": "Advanced chess strategies",
            "schedule": "Wednesdays, 3:30 PM - 5:00 PM",
            "location": "Room 205",
            "category": "Games",
            "max_participants": 20,
        },
    )

    assert response.status_code == 200
    activity = activities["Chess Club"]
    assert activity["description"] == "Advanced chess strategies"
    assert activity["location"] == "Room 205"
    assert activity["category"] == "Games"
    assert activity["max_participants"] == 20


def test_admin_can_archive_and_reactivate_activity():
    reset_activities()

    archive_response = client.patch("/activities/Chess%20Club/archive")
    assert archive_response.status_code == 200
    assert activities["Chess Club"]["active"] is False
    assert client.get("/activities").json() == {}

    reactivate_response = client.patch("/activities/Chess%20Club/reactivate")
    assert reactivate_response.status_code == 200
    assert activities["Chess Club"]["active"] is True
    assert "Chess Club" in client.get("/activities").json()


def test_admin_can_delete_activity():
    reset_activities()

    response = client.delete("/activities/Chess%20Club")

    assert response.status_code == 204
    assert "Chess Club" not in activities


def test_activity_validation_rejects_invalid_data():
    reset_activities()

    response = client.post(
        "/activities",
        json={
            "name": "",
            "description": "Invalid activity",
            "schedule": "Mondays, 3:00 PM - 4:00 PM",
            "location": "Room 1",
            "category": "Arts",
            "max_participants": 0,
        },
    )

    assert response.status_code == 422
    assert "name" in response.text.lower()
    assert "max_participants" in response.text.lower()


def test_signup_rejects_full_activity():
    reset_activities()
    activities["Chess Club"]["participants"] = [
        "student1@mergington.edu",
        "student2@mergington.edu",
        "student3@mergington.edu",
        "student4@mergington.edu",
        "student5@mergington.edu",
        "student6@mergington.edu",
        "student7@mergington.edu",
        "student8@mergington.edu",
        "student9@mergington.edu",
        "student10@mergington.edu",
        "student11@mergington.edu",
        "student12@mergington.edu",
    ]

    response = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": "student13@mergington.edu"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is full"
