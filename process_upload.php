<?php

date_default_timezone_set('Asia/Manila'); // Set the timezone to avoid warnings
header('Content-Type: application/json'); // Ensure the response is JSON

// Function to split the file into chunks and create separate text files
function splitAndCreateFiles($filePath, $name)
{
    // Read the content of the file
    $lines = file($filePath);

    // Determine the number of lines in the file
    $totalLines = count($lines);

    // Calculate the number of chunks (each with 6,000 lines)
    $numChunks = ceil($totalLines / 6000);

    // Split the lines into chunks
    $lineChunks = array_chunk($lines, 6000);

    // Create separate text files for each chunk
    $filePaths = array(); // Array to store paths of created text files
    for ($i = 0; $i < $numChunks; $i++) {
        // Create a new text file
        $newFilePath = $name . "_" . ($i + 1) . '.txt';
        $handle = fopen($newFilePath, 'w');

        // Write the chunk of lines to the new text file
        fwrite($handle, implode('', $lineChunks[$i]));

        // Close the file handle
        fclose($handle);

        // Add the path of the created text file to the array
        $filePaths[] = $newFilePath;
    }

    return array($filePath, $filePaths); // Return array with original file path and paths of created text files
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        // Handle file upload
        // Specify the directory where uploaded files will be stored
        $uploadDir = 'uploads/';

        // Ensure the directory exists
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Get the uploaded file name
        $uploadedFile = $uploadDir . basename($_FILES['file']['name']);

        // Move the uploaded file to the specified directory
        if (move_uploaded_file($_FILES['file']['tmp_name'], $uploadedFile)) {
            echo "File uploaded successfully.";
        } else {
            echo "Error uploading file.";
        }
    } elseif (isset($_POST['action']) && $_POST['action'] === 'split' && isset($_POST['file'])) {
        // Handle file splitting
        $file = $_POST['file'];
        $uploadDir = 'uploads/';
        $filePath = $uploadDir . basename($file);

        if (file_exists($filePath)) {
            list($name) = explode(".", $file);

            // Split the file into chunks and create separate text files
            list($originalFilePath, $filePaths) = splitAndCreateFiles($filePath, $name);

            // Create a zip archive containing the text files
            $zip = new ZipArchive();
            $zipFileName = $name . date('YmdHis') . '.zip';

            if ($zip->open($zipFileName, ZipArchive::CREATE) === TRUE) {
                foreach ($filePaths as $filePath) {
                    $zip->addFile($filePath, basename($filePath));
                }
                $zip->close();

                // Delete the original text file
                unlink($originalFilePath);

                // Return the zip file name to the client for download
                echo $zipFileName;

                // Delete the created text files
                foreach ($filePaths as $filePath) {
                    unlink($filePath);
                }
            } else {
                echo "Error: Failed to create zip archive.";
            }
        } else {
            echo "Error: File not found.";
        }
    } elseif (isset($_POST['action']) && $_POST['action'] === 'delete' && isset($_POST['file'])) {
        // Handle file deletion
        $file = $_POST['file'];
        if (file_exists($file)) {
            unlink($file);
            echo "Zip file deleted successfully.";
        } else {
            echo "Error: File not found.";
        }
    } else {
        echo "Error: Invalid request.";
    }
} else {
    echo "Error: Invalid request method.";
}









