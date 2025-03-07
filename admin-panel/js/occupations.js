class Occupation {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
    update(newData) {
        if (newData.name) this.name = newData.name;
    }
}

class OccupationContainer {
    constructor() {
        this.occupations = [];
    }

    addOccupation(occupation) {
        if (!(occupation instanceof Occupation)) {
            throw new Error("Invalid occupation object. Must be an instance of Occupation.");
        }
        this.occupations.push(occupation);
    }

    getOccupationById(id) {
        return this.occupations.find(occupation => occupation.id === id);
    }

    getAllOccupations() {
        return this.occupations;
    }

    removeOccupationById(id) {
        const initialLength = this.occupations.length;
        this.occupations = this.occupations.filter(occupation => occupation.id !== id);
        return this.occupations.length < initialLength;
    }
    updateOccupation(id, newData) {
        const occupation = this.getOccupationById(id);
        if (occupation) {
            occupation.update(newData);
            return true;
        }
        return false;
    }
}

// --- EventOccupation Class and Container ---
class EventOccupation {
    constructor(eventOccupationId, eventId, eventName, occupationId, occupationName, mentorCount, hoursCount) {
        this.eventOccupationId = eventOccupationId; // Added eventOccupationId
        this.eventId = eventId;
        this.eventName = eventName;
        this.occupationId = occupationId;
        this.occupationName = occupationName;
        this.mentorCount = mentorCount;
        this.hoursCount = hoursCount;
    }
}

class EventOccupationContainer {
    constructor() {
        this.eventOccupations = [];
    }

    addEventOccupation(eventOccupation) {
        if (!(eventOccupation instanceof EventOccupation)) {
            throw new Error("Invalid eventOccupation object. Must be an instance of EventOccupation.");
        }
        this.eventOccupations.push(eventOccupation);
    }

    getAllEventOccupations() {
        return this.eventOccupations;
    }

    getEventOccupationById(eventOccupationId) { // Added get by ID
        return this.eventOccupations.find(eo => eo.eventOccupationId === eventOccupationId);
    }

    removeEventOccupationById(eventOccupationId) { // Changed to remove by ID
        const initialLength = this.eventOccupations.length;
        this.eventOccupations = this.eventOccupations.filter(eo => eo.eventOccupationId !== eventOccupationId);
        return this.eventOccupations.length < initialLength;
    }
}

// --- Global Instances ---
const occupationContainer = new OccupationContainer();
const eventOccupationContainer = new EventOccupationContainer();

$(document).ready(function () {

    // --- Event Handlers (using event delegation) ---
    $('#occupationsTable tbody').on('click', '.edit-button', handleEditOccupationClick);
    $('#occupationsTable tbody').on('click', '.cancel-button', handleCancelOccupationClick);
    $('#occupationsTable tbody').on('click', '.delete-button', handleDeleteOccupationClick);
    $('#eventOccupationsTable tbody').on('click', '.delete-event-occupation-button', handleDeleteEventOccupationClick);

    $('#addOccupationToEventBtn').click(handleAddOccupationToEvent);
    $('#newOccupationEventBtn').click(showAddOccupationEventForm);


    // --- Load Initial Data ---
    loadOccupations();
    loadEventsIntoSelect();
    loadOccupationsIntoSelect();
    loadEventOccupations();


    // --- Function Definitions ---

    function handleEditOccupationClick() {
        let row = $(this).closest('tr');
        if ($(this).text() === 'Szerkesztés') {
            startEditingOccupation(row);
        } else {
            finishEditingOccupation(row);
        }
    }

    function startEditingOccupation(row) {
        row.find('input.occupation-data').removeAttr('readonly');
        row.find('.edit-button').text('Mentés');
        let cancelBtn = $('<button class="btn btn-secondary btn-sm cancel-button">Mégse</button>');
        row.find('.edit-button').after(cancelBtn);
        row.find('input.occupation-data').each(function () {
            $(this).data('original-value', $(this).val());
        });
    }

    function finishEditingOccupation(row) {
        let occupationId = parseInt(row.find('.occupation-id').text(), 10);
        let updatedData = {
            name: row.find('input[data-field="name"]').val()
        };
        if (occupationContainer.updateOccupation(occupationId, updatedData)) {
            console.log("Occupation updated in container.  Ready to save to server:", occupationId, updatedData);

            $.ajax({
                type: "POST",
                url: "../backend/api/workshops/update_workshop.php",
                dataType: 'json',
                data: {
                    occupation_id: occupationId, // Send occupation_id
                    ...updatedData            // Send updated name
                },
                success: function (data) {
                    console.log("Occupation updated on server:", data);
                    alert("Műhely sikeresen frissítve!");

                    row.find('input.occupation-data').attr('readonly', true);
                    row.find('.edit-button').text('Szerkesztés');
                    row.find('.cancel-button').remove();
                },
                error: function (xhr, status, error) {
                    console.error("Hiba a műhely frissítése közben:", xhr, status, error);
                    let errorMessage = "Ismeretlen hiba történt.";

                    if (xhr.status === 400) {
                        try {
                            let errorData = JSON.parse(xhr.responseText);
                            errorMessage = errorData.message ? errorData.message : "Érvénytelen adatok lettek elküldve.";
                            if (errorData && errorData.errors) {
                                errorMessage = errorData.errors.join("<br>");
                            }
                        } catch (e) {
                            errorMessage = "Érvénytelen kérés.";
                        }
                    } else if (xhr.status === 404) {
                        errorMessage = "A frissítendő műhely nem található.";
                    } else if (xhr.status === 500) {
                        errorMessage = "Szerverhiba történt. Kérlek, próbáld újra később.";
                    }
                    alert("Hiba: " + errorMessage);
                }
            });
        } else {
            console.error("Occupation with ID " + occupationId + " not found for update.");
            alert("Occupation with ID " + occupationId + " not found for update.");
        }
    }
    function handleCancelOccupationClick() {
        let row = $(this).closest('tr');
        row.find('input.occupation-data').each(function () {
            $(this).val($(this).data('original-value')).attr('readonly', true);
        });
        $(this).remove();
        row.find('.edit-button').text('Szerkesztés');
    }

    function handleDeleteOccupationClick() {
        let row = $(this).closest('tr');
        if (confirm('Biztosan törölni szeretnéd?')) {
            let occupationId = parseInt(row.find('.occupation-id').text(), 10);
            if (occupationContainer.removeOccupationById(occupationId)) {
                row.remove();
                //TODO: add ajax
            } else {
                console.error("Occupation with ID " + occupationId + " not found for deletion."); // Handle error
            }
        }
    }

    function handleDeleteEventOccupationClick() {
        let row = $(this).closest('tr');
        if (confirm('Biztosan törölni szeretnéd?')) {
            let eventOccupationId = parseInt(row.find('.event-occupation-id').text(), 10); // Get by ID

            if (eventOccupationContainer.removeEventOccupationById(eventOccupationId)) { // Remove by ID
                row.remove();
                console.log("Event-Occupation removed");
                alert("Event-Occupation removed! (Replace this with AJAX)"); // Replace with AJAX
                // TODO: Add AJAX call to php/delete_esemeny_foglalkozas.php
            } else {
                console.error("Event-Occupation not found for deletion.");
            }
        }
    }

    function loadOccupations() {
        // TODO: Replace with AJAX call to php/get_foglalkozasok.php
        // Placeholder data:
        const occupation1 = new Occupation(1, "Lego Robot");
        const occupation2 = new Occupation(2, "Áramkör építés");
        occupationContainer.addOccupation(occupation1);
        occupationContainer.addOccupation(occupation2);

        $('#occupationsTable tbody').empty();
        occupationContainer.getAllOccupations().forEach(function (occupation) {
            addOccupationRow(occupation);
        });
    }
    function loadEventsIntoSelect() {
        // TODO: Replace with AJAX
        var events = eventContainer.getAllEvents(); // Use the existing eventContainer
        let options = '<option value="">Válassz eseményt</option>';
        events.forEach(event => {
            options += `<option value="${event.id}">${event.name} - ${event.date}</option>`;
        });
        $('#eventSelect').html(options);
    }
    function loadOccupationsIntoSelect() {
        let options = '<option value="">Válassz foglalkozást</option>';
        occupationContainer.getAllOccupations().forEach(occupation => {
            options += `<option value="${occupation.id}">${occupation.name}</option>`;
        });
        $('#occupationSelectEvent').html(options); // Use the correct ID!
    }

    function loadEventOccupations() {
        // TODO: Replace with AJAX call to php/get_esemeny_foglalkozasok.php
        // Placeholder data:

        const eo1 = new EventOccupation(1, 1, "Dance Rehearsal", 1, "Lego Robot", 2, 4);
        const eo2 = new EventOccupation(2, 2, "Poetry Slam", 2, "Áramkör építés", 5, 2);
        eventOccupationContainer.addEventOccupation(eo1);
        eventOccupationContainer.addEventOccupation(eo2);

        $('#eventOccupationsTable tbody').empty();
        eventOccupationContainer.getAllEventOccupations().forEach(function (eventOccupation) {
            addEventOccupationRow(eventOccupation);
        });
    }

    // -- Add Row Functions --
    function addOccupationRow(occupation) {
        let row = $('<tr>');
        row.append('<td hidden><span class="occupation-id">' + occupation.id + '</span></td>');
        row.append($('<td>').text(occupation.id)); // Display ID
        row.append($('<td>').append($('<input type="text" class="form-control occupation-data" data-field="name" readonly>').val(occupation.name)));

        let actionsCell = $('<td>');
        let editButton = $('<button class="btn btn-primary btn-sm edit-button">Szerkesztés</button>');
        let deleteButton = $('<button class="btn btn-danger btn-sm delete-button">Törlés</button>');
        actionsCell.append(editButton, deleteButton);

        row.append(actionsCell);
        $('#occupationsTable tbody').append(row);
    }

    function addEventOccupationRow(eventOccupation) {
        let row = $('<tr>');
        // Add the hidden ID cell:
        row.append('<td hidden><span class="event-occupation-id">' + eventOccupation.eventOccupationId + '</span></td>');
        row.append($('<td>').text(eventOccupation.eventName));
        row.append($('<td>').text(eventOccupation.occupationName));
        row.append($('<td>').text(eventOccupation.mentorCount));
        row.append($('<td>').text(eventOccupation.hoursCount));

        let deleteButton = $('<button class="btn btn-danger btn-sm delete-event-occupation-button">Törlés</button>');
        row.append($('<td>').append(deleteButton));

        $('#eventOccupationsTable tbody').append(row);
    }

    // -- Form Show/Hide Functions --

    function showAddOccupationEventForm() {
        loadEventsIntoSelect();
        loadOccupationsIntoSelect();
        $('#addOccupationEventForm').show();
    }
    //--Add Event Occupation Handler--
    function handleAddOccupationToEvent() {
        let eventId = $('#eventSelect').val();
        let occupationId = $('#occupationSelectEvent').val();
        let mentorCount = $('#mentorCount').val();
        let hoursCount = $('#hoursCount').val();

        if (!eventId || !occupationId || !mentorCount || !hoursCount) {
            alert('Kérlek válassz eseményt, foglalkozást, és add meg a szükséges mentorok számát és óraszámot!');
            return;
        }
        if (isNaN(parseInt(hoursCount)) || parseInt(hoursCount) <= 0) {
            alert("Az órák száma egy 0-nál nagyobb szám kell, hogy legyen!");
            return;
        }
        if (isNaN(parseInt(mentorCount)) || parseInt(mentorCount) <= 0) {
            alert('A szükséges mentorok száma egy 0-nál nagyobb szám kell, hogy legyen!');
            return;
        }

        let event = eventContainer.getEventById(parseInt(eventId));
        let occupation = occupationContainer.getOccupationById(parseInt(occupationId));
        if (!event || !occupation) {
            console.error("Event or occupation not found")
            return;
        }

        // Find the next available ID
        let maxId = 0;
        eventOccupationContainer.getAllEventOccupations().forEach(function (eo) {
            if (eo.eventOccupationId > maxId) {
                maxId = eo.eventOccupationId;
            }
        });
        let newId = maxId + 1;
        const eventOccupation = new EventOccupation(newId, parseInt(eventId), event.name, parseInt(occupationId), occupation.name, parseInt(mentorCount), parseInt(hoursCount));
        eventOccupationContainer.addEventOccupation(eventOccupation);

        addEventOccupationRow(eventOccupation); // Add to the DOM
        console.log("Adding occupation to event:", { eventId, occupationId, mentorCount, hoursCount });
        alert("Adding occupation to event (Replace this with AJAX)");
        // TODO: AJAX call to php/add_esemeny_foglalkozas.php

    }
    return {
        Occupation: Occupation,
        OccupationContainer: OccupationContainer,
        occupationContainer: occupationContainer,
        EventOccupation: EventOccupation,
        EventOccupationContainer: EventOccupationContainer,
        eventOccupationContainer: eventOccupationContainer
    };
});
// Expose Occupation and OccupationContainer
