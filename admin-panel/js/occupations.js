class Occupation {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.description = "Iskolai foglalkozás";
    }
    update(newData) {
        if (newData.name) this.name = newData.name;
        if (newData.description) this.description = newData.description;
    }
    toJson() {
        return {
            name: this.name,
            description: this.description
        };
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
    constructor(eventOccupationId, eventId, eventName, occupationId, occupationName, mentorCount, hoursCount, busyness) {
        this.eventOccupationId = eventOccupationId; // Added eventOccupationId
        this.eventId = eventId;
        this.eventName = eventName;
        this.occupationId = occupationId;
        this.occupationName = occupationName;
        this.mentorCount = mentorCount;
        this.hoursCount = hoursCount;
        this.busyness = busyness;
    }
    toJson() {
        return {
            event_workshop_id: this.eventOccupationId,
            evenet_id: this.eventId,
            workshop_id: this.occupationId,
            hours_count: this.hoursCount,
            mentor_count: this.mentorCount,
            busyness: this.busyness == "magas" ? "high" : "low"

        };
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
    getEventOccupationsByEventId(eventId) {
        return this.eventOccupations.filter(eo => eo.eventId === eventId);
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

$(document).ready(function() {
    // --- Load Initial Data ---
    loadEventsIntoSelect(); // Load events first
    loadEventOccupations(); // Load event-occupations (for filtering)
    loadOccupations(); // Load occupations

    // --- Event Handlers (using event delegation) ---
    $('#eventSelect').on('change', handleEventSelectionChange);
    $('#saveOccupationsBtn').on('click', saveOccupations);
    $(document).on('eventAdded', loadEventsIntoSelect);

      $('#occupationsTable tbody').on('click', '.edit-button', handleEditOccupationClick);
    $('#occupationsTable tbody').on('click', '.cancel-button', handleCancelOccupationClick);
    $('#occupationsTable tbody').on('click', '.delete-button', handleDeleteOccupationClick);
    $('#addOccupationBtn').click(handleAddOccupation);


    function handleEventSelectionChange() {
        const selectedEventId = parseInt($(this).val(), 10);
        $('#eventOccupationsTable tbody').empty();
        if (selectedEventId) {
            const filteredEventOccupations = eventOccupationContainer.getEventOccupationsByEventId(selectedEventId);

            $.each(filteredEventOccupations, function(index, eventOccupation) {
                addOccupationRow(eventOccupation);
            });

            $('#occupationsTableContainer').show();
        }
    }
     function loadEventsIntoSelect() {
        $.ajax({
            type: "GET",
            url: "../backend/api/events/get_events.php",
            dataType: 'json',
            success: function (data) {
                eventContainer.events = [];

                data.forEach(function (eventData) {
                    const event = new Event(
                        eventData.event_id,
                        eventData.name,
                        eventData.date,
                        eventData.location,
                        eventData.busyness,
                        eventData.status
                    );
                    eventContainer.addEvent(event);
                });
                var events = eventContainer.getAllEvents(); // Use the existing eventContainer
                let options = '<option value="">Válassz eseményt</option>';
                events.forEach(event => {
                    options += `<option value="${event.id}">${event.name} - ${event.date}</option>`;
                });
                $('#eventSelect').html(options);
            },
            error: function (xhr, status, error) {
                console.error("Error fetching events:", error);
                alert("Hiba történt az események betöltésekor. Kérlek, próbáld újra később.");
            }
        });
    }

    function loadEventOccupations() {
        $.ajax({
            url: "../backend/api/event_workshops/get_event_workshops.php",
            type: "GET",
            dataType: "json",
            success: function (data) {
                eventOccupationContainer.eventOccupations = [];

                data.forEach(function (eventWorkshop) {
                    const eo = new EventOccupation(
                        eventWorkshop.event_workshop_id,
                        eventWorkshop.event_id,
                        eventWorkshop.event_name,
                        eventWorkshop.workshop_id,
                        eventWorkshop.workshop_name,
                        eventWorkshop.number_of_mentors_required,
                        eventWorkshop.number_of_teachers_required, // Get data from API
                        eventWorkshop.busyness
                    );

                    eventOccupationContainer.addEventOccupation(eo);
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error("Error loading event workshops:", textStatus, errorThrown);
                alert("Failed to load event workshops. Please try again later.");
            }
        });
    }

    function loadOccupations() {
        $.ajax({
            url: '../backend/api/workshops/get_workshops.php',
            type: 'GET',
            success: function (data) {
                 $('#eventOccupationsTable tbody').empty(); //Clear the other occupationsTable
                occupationContainer.occupations = []; // Clear local occupations
                data.forEach(function (occupationData) {
                    const occupation = new Occupation(occupationData.workshop_id, occupationData.name, occupationData.description);
                    occupationContainer.addOccupation(occupation); //Repopulate it with the current data.
                    addOccupationRowToMainTable(occupation);
                });
            },
            error: function (xhr, status, error) {
                console.error("Error loading occupations:", status, error);
                alert("Hiba történt a foglalkozások betöltésekor. Kérlek próbáld újra később.");
            }
        });
    }

    function addOccupationRowToMainTable(occupation) {
        let row = $('<tr>');
        row.append('<td hidden><span class="occupation-id">' + occupation.id + '</span></td>');
        row.append($('<td>').text(occupation.id)); // Display ID
        row.append($('<td>').append($('<input type="text" class="form-control occupation-data" data-field="name" readonly>').val(occupation.name)));

        let actionsCell = $('<td>');
        let editButton = $('<button class="btn btn-primary btn-sm edit-button">Szerkesztés</button>');
        let deleteButton = $('<button class="btn btn-danger btn-sm delete-button">Törlés</button>');
        actionsCell.append(editButton, deleteButton);

        row.append(actionsCell);
        $('#occupationsTable tbody:first').append(row); // Append to the first tbody
    }
    function addOccupationRow(eventOccupation) {
        // Get the full occupation object for the name
        const occupation = occupationContainer.getOccupationById(eventOccupation.occupationId);

        if (!occupation) {
            console.error("Occupation not found for ID:", eventOccupation.occupationId);
            return; // Exit if occupation not found
        }
    
        const row = `
            <tr class="occupation-row" data-event-occupation-id="${eventOccupation.eventOccupationId}">
                <td class="occupation-name">${occupation.name}</td>
                <td>
                    <input type="checkbox" class="form-check-input occupation-checkbox" ${eventOccupation.isIncluded ? '' : 'checked'}>
                </td>
                <td>
                    <input type="number" class="form-control mentor-diak-count" min="0" value="${eventOccupation.mentorCount}">
                </td>
                <td>
                    <input type="number" class="form-control mentor-tanar-count" min="0" value="${eventOccupation.teacherCount}">
                </td>
                <td>
                    <input type="number" class="form-control hours-count" min="0" value="${eventOccupation.hoursCount}">
                </td>
                <td>
                    <select class="form-control workload-select">
                        <option value="high" ${eventOccupation.busyness === 'high' ? 'selected' : ''}>Magas</option>
                        <option value="low" ${eventOccupation.busyness === 'low' ? 'selected' : ''}>Alacsony</option>
                    </select>
                </td>
            </tr>`;
        $('#occupationsTableContainer tbody').append(row);
    }
    

    function saveOccupations() {
        const eventId = $('#eventSelect').val(); // Get the selected event ID.
        const occupationsData = [];

        // Iterate over each occupation row.  Use the .each() method with a standard function
        $('.occupation-row').each(function() {
            const row = $(this);
            const eventOccupationId = parseInt(row.data('event-occupation-id'), 10);
            const isChecked = row.find('.occupation-checkbox').prop('checked');
            const mentorDiakCount = parseInt(row.find('.mentor-diak-count').val(), 10);
            const mentorTanarCount = parseInt(row.find('.mentor-tanar-count').val(), 10);
            const workload = row.find('.workload-select').val();
            const hours_count = parseInt(row.find('.hours-count').val(), 10);
            const eventOccupation = eventOccupationContainer.getEventOccupationById(eventOccupationId);

            if(eventOccupation && isChecked) { //if it exists and is checked, add
                occupationsData.push({
                        event_workshop_id: eventOccupation.eventOccupationId,  // Use eventOccupationId
                        event_id: eventOccupation.eventId, // Include eventId
                        workshop_id: eventOccupation.occupationId,
                        number_of_mentors_required: mentorDiakCount,
                        number_of_teachers_required: mentorTanarCount,
                        busyness: workload,
                        max_workable_hours: hours_count
                });
            }
        });

        console.log("Data to be saved:", occupationsData);

        // Send the data to the server
        $.ajax({
            url: '../backend/api/event_workshops/save_event_workshops.php', // Corrected URL
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(occupationsData),
            success: function(response) {
                console.log('Save successful:', response);
                alert('Sikeres mentés!');
                loadEventOccupations();  // Reload after saving
                $('#eventOccupationsTable tbody').empty();  // Clear rows.
            },
            error: function(xhr, status, error) {
                console.error('Save failed:', error, xhr.responseText);
                alert('Hiba a mentés során!  Részletek a konzolban.');
            }
        });
    }
     function handleAddOccupation() {
        let occupationName = $('#newOccupationName').val().trim();

        if (!occupationName) {
            alert('Kérlek adj meg egy foglalkozás nevet!');
            return;
        }

        let maxId = 0;
        occupationContainer.getAllOccupations().forEach(occupation => {
            if (occupation.id > maxId) {
                maxId = occupation.id;
            }
        });
        let newId = maxId + 1;

        const newOccupation = new Occupation(newId, occupationName);
        console.log(newOccupation.toJson());
        $('#newOccupationName').val('');
        $.ajax({
            type: "POST",
            url: "../backend/api/workshops/add_workshop.php",
            data: newOccupation.toJson(),
            success: function (data) {
                occupationContainer.addOccupation(newOccupation);
                loadOccupations();
            },
            error: function (xhr, status, error) {
                console.error("Hiba a foglalkozás frissítése közben:", xhr, status, error);
            }
        });
    }
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
            name: row.find('input[data-field="name"]').val(),
            description: 'Iskolai foglakozás'
        };
        if (!updatedData.name) {
            alert("A foglalkozás neve nem lehet üres!");
            return;
        }
        if (occupationContainer.updateOccupation(occupationId, updatedData)) {
            $.ajax({
                type: "POST",
                url: "../backend/api/workshops/update_workshop.php",
                data: {
                    workshop_id: occupationId,
                    ...updatedData
                },
                success: function (data) {
                    console.log("Occupation updated on server:", data);
                    row.find('input.occupation-data').attr('readonly', true);
                    row.find('.edit-button').text('Szerkesztés');
                    row.find('.cancel-button').remove();
                    loadOccupations();
                },
                error: function (xhr, status, error) {
                    console.error("Hiba a foglalkozás frissítése közben:", xhr, status, error);
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
                        errorMessage = "A frissítendő foglalkozás nem található.";
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
        let occupationId = parseInt(row.find('.occupation-id').text(), 10);
        if (confirm('Biztosan törölni szeretnéd?')) {
            $.ajax({
                type: "DELETE",
                url: `../backend/api/workshops/delete_workshop.php?workshop_id=${occupationId}`,
                success: function (response) {
                    if (occupationContainer.removeOccupationById(occupationId)) {
                        row.remove();
                        loadOccupations();
                    } else {
                        console.error("Occupation with ID " + occupationId + " not found locally.");
                        alert("Foglalkozás nem található.");
                    }

                },
                error: function (xhr, status, error) {
                    console.error("Hiba a foglalkozás törlése közben:", xhr.responseText, status, error);
                    alert("Hiba a foglalkozás törlése közben: " + xhr.responseText);
                }
            });
        }
    }
});