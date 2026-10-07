document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  const adminToggle = document.getElementById("admin-toggle");
  const adminContent = document.getElementById("admin-content");
  const activityForm = document.getElementById("activity-form");
  const activitySubmit = document.getElementById("activity-submit");
  const activityCancel = document.getElementById("activity-cancel");
  const activityEditing = document.getElementById("activity-editing");
  const adminActivities = document.getElementById("admin-activities");

  let adminVisible = false;

  function showMessage(text, type = "success") {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    window.setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  async function fetchAdminActivities() {
    const response = await fetch("/admin/activities");
    if (!response.ok) {
      throw new Error("Unable to load admin activities");
    }

    const activities = await response.json();
    adminActivities.innerHTML = "";

    Object.entries(activities).forEach(([name, details]) => {
      const card = document.createElement("article");
      card.className = "admin-activity-card";
      const status = details.active ? "Active" : "Archived";
      card.innerHTML = `
        <div>
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.category)} · ${escapeHtml(details.schedule)}</p>
          <span class="status-badge ${details.active ? "active" : "archived"}">${status}</span>
        </div>
        <div class="admin-card-actions">
          <button type="button" data-action="edit" data-activity="${escapeHtml(name)}">Edit</button>
          <button type="button" data-action="toggle" data-activity="${escapeHtml(name)}">${details.active ? "Archive" : "Reactivate"}</button>
          <button type="button" class="danger-button" data-action="delete" data-activity="${escapeHtml(name)}">Delete</button>
        </div>
      `;
      adminActivities.appendChild(card);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function resetActivityForm() {
    activityForm.reset();
    activityEditing.value = "";
    activitySubmit.textContent = "Add Activity";
    activityCancel.hidden = true;
  }

  function populateActivityForm(name, details) {
    activityEditing.value = name;
    document.getElementById("activity-name").value = name;
    document.getElementById("activity-description").value = details.description;
    document.getElementById("activity-schedule").value = details.schedule;
    document.getElementById("activity-location").value = details.location;
    document.getElementById("activity-category").value = details.category;
    document.getElementById("activity-capacity").value = details.max_participants;
    activitySubmit.textContent = "Save Changes";
    activityCancel.hidden = false;
    document.getElementById("activity-name").disabled = true;
    document.getElementById("activity-name").required = false;
  }

  function clearEditState() {
    document.getElementById("activity-name").disabled = false;
    document.getElementById("activity-name").required = true;
    resetActivityForm();
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || "The request could not be completed");
    }
    return data;
  }

  adminToggle.addEventListener("click", async () => {
    adminVisible = !adminVisible;
    adminContent.classList.toggle("hidden", !adminVisible);
    adminToggle.textContent = adminVisible ? "Hide Admin" : "Show Admin";

    if (adminVisible) {
      try {
        await fetchAdminActivities();
      } catch (error) {
        showMessage(error.message, "error");
      }
    }
  });

  activityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(activityForm);
    const payload = Object.fromEntries(formData.entries());
    payload.max_participants = Number(payload.max_participants);
    const editing = activityEditing.value;

    try {
      const endpoint = editing ? `/activities/${encodeURIComponent(editing)}` : "/activities";
      const method = editing ? "PUT" : "POST";
      await requestJson(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      showMessage(editing ? "Activity updated." : "Activity added.");
      clearEditState();
      await fetchActivities();
      await fetchAdminActivities();
    } catch (error) {
      showMessage(error.message, "error");
    }
  });

  activityCancel.addEventListener("click", clearEditState);

  adminActivities.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const name = button.dataset.activity;
    const action = button.dataset.action;

    try {
      if (action === "edit") {
        const response = await fetch(`/admin/activities`);
        const activities = await response.json();
        populateActivityForm(name, activities[name]);
        return;
      }

      if (action === "delete") {
        if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
        await requestJson(`/activities/${encodeURIComponent(name)}`, { method: "DELETE" });
        showMessage(`${name} was deleted.`);
      } else {
        const activities = await requestJson(`/admin/activities`);
        const activity = activities[name];
        const endpoint = `/activities/${encodeURIComponent(name)}/${activity.active ? "archive" : "reactivate"}`;
        await requestJson(endpoint, { method: "PATCH" });
        showMessage(`${name} was ${activity.active ? "archived" : "reactivated"}.`);
      }

      await fetchActivities();
      await fetchAdminActivities();
    } catch (error) {
      showMessage(error.message, "error");
    }
  });

  // Initialize app
  fetchActivities();
});
