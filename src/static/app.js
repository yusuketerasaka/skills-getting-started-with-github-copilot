document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const selectedActivity = activitySelect.value;
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.replaceChildren();
      activitySelect.replaceChildren();
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- Select an activity --";
      activitySelect.appendChild(placeholder);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        schedule.innerHTML = "<strong>Schedule:</strong> ";
        schedule.append(details.schedule);
        activityCard.appendChild(schedule);

        const availability = document.createElement("p");
        availability.innerHTML = "<strong>Availability:</strong> ";
        availability.append(`${spotsLeft} spots left`);
        activityCard.appendChild(availability);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsSection.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        details.participants.forEach((email) => {
          const participant = document.createElement("li");
          participant.className = "participant-item";

          const participantEmail = document.createElement("span");
          participantEmail.textContent = email;
          participant.appendChild(participantEmail);

          const deleteButton = document.createElement("button");
          deleteButton.type = "button";
          deleteButton.className = "participant-delete";
          deleteButton.setAttribute("aria-label", `Unregister ${email}`);
          deleteButton.title = "Unregister participant";

          const deleteIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          deleteIcon.setAttribute("viewBox", "0 0 24 24");
          deleteIcon.setAttribute("aria-hidden", "true");
          deleteIcon.setAttribute("focusable", "false");
          const deleteIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          deleteIconPath.setAttribute("d", "M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3");
          deleteIconPath.setAttribute("fill", "none");
          deleteIconPath.setAttribute("stroke", "currentColor");
          deleteIconPath.setAttribute("stroke-linecap", "round");
          deleteIconPath.setAttribute("stroke-linejoin", "round");
          deleteIconPath.setAttribute("stroke-width", "1.8");
          deleteIcon.appendChild(deleteIconPath);
          deleteButton.appendChild(deleteIcon);

          deleteButton.addEventListener("click", async () => {
            deleteButton.disabled = true;
            try {
              const unregisterResponse = await fetch(
                `/activities/${encodeURIComponent(name)}/participants/${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const result = await unregisterResponse.json();

              if (!unregisterResponse.ok) {
                throw new Error(result.detail || "Unable to unregister participant");
              }

              await fetchActivities();
              messageDiv.textContent = result.message;
              messageDiv.className = "success";
              messageDiv.classList.remove("hidden");
            } catch (error) {
              messageDiv.textContent = error.message || "Unable to unregister participant";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }
          });

          participant.appendChild(deleteButton);
          participantsList.appendChild(participant);
        });
        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        option.selected = name === selectedActivity;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
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

  // Initialize app
  fetchActivities();
});
