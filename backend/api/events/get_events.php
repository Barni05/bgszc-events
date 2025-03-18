<?php
    require_once $_SERVER["DOCUMENT_ROOT"]."/bgszc-events/backend/config.php";
    require_once $_SERVER["DOCUMENT_ROOT"]."/bgszc-events/backend/api_utils.php";
    if(validate_request("GET", array())) {
        header("Content-Type: application/json");
        $query = "SELECT `event_id`, `name`, `date`, `location`, `status` FROM `events`;";
        $stmt = $conn->prepare($query);
        if($stmt->execute()) {
            echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
            http_response_code(200);
        } else {
            echo $stmt->error;
            http_response_code(500);
        }
    } else {
        echo "<img src='https://http.cat/400'>";
        http_response_code(400);
    }
