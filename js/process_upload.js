let uploadedFileName = '';
const MAX_FILE_SIZE = 90 * 1024 * 1024; // Max file size limit
let isFileSplit = false; // Variable to track if the file has been split

function _(el) {
   return document.getElementById(el);
}

function uploadFile() {
   var file = _('file').files[0];

   if (file.size > MAX_FILE_SIZE) {
      //alert('File is too large. Maximum file size is 5 MB. The text file selected is ' + formatBytes(file.size) + '.');
      swal.fire({
         icon: 'error',
         title: 'File Too Large',
         text: `File is too large. Maximum file size is ${formatBytes(MAX_FILE_SIZE)}. The text file selected is ${formatBytes(file.size)}.`,
      });
      _('file').value = ''; // Clear the file input field
      return;
   }

   _('file_name').innerText = 'Selected text file: ' + file.name;

   var formdata = new FormData();
   formdata.append('file', file);
   var ajax = new XMLHttpRequest();
   ajax.upload.addEventListener('progress', progressHandler, false);
   ajax.addEventListener(
      'load',
      function (event) {
         uploadedFileName = file.name; // Save the uploaded file name
         _('status').innerHTML = '<div style="color:green">File uploaded successfully.</div><br><hr>';
         _('progressBar').value = 0;
         isFileSplit = false; // Reset isFileSplit when a new file is uploaded
      },
      false,
   );
   ajax.addEventListener('error', errorHandler, false);
   ajax.addEventListener('abort', abortHandler, false);
   ajax.open('POST', 'process_upload.php'); // Use the same PHP file for upload and split
   ajax.send(formdata);
}

function splitFile() {
   if (!uploadedFileName) {
      //alert('Please upload a text file first.');
      swal.fire({
         icon: 'error',
         text: 'Please upload a text file first.',
      });
      return;
   }

   if (isFileSplit) {
      // Display message that file has already been split
      swal.fire({
         icon: 'info',
         text: 'The file has already been split. Please upload a new text file to split.',
      });
      return;
   }

   // Display message that splitting is in progress with a spinner icon
   _('status').innerHTML =
      'Splitting file. Please wait...<img src="icon/icons8-spinner.gif" alt="Loading..." style="vertical-align: middle; width: 27px; height: 27px;"><br><hr>';

   var ajax = new XMLHttpRequest();
   ajax.open('POST', 'process_upload.php');
   ajax.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
   ajax.onreadystatechange = function () {
      if (ajax.readyState === 4 && ajax.status === 200) {
         var zipFileName = ajax.responseText;

         // Create a temporary link element for downloading the zip file
         var link = document.createElement('a');
         link.href = zipFileName;
         link.download = zipFileName.split('/').pop();
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);

         // Display message that split is successful
         _('status').innerHTML =
            '<span style="color: green">Split successful</span>. Check downloads for the zip file <img src="icon/rar.png" style="vertical-align: middle; width: 25px; height: 25px;"><br><hr>';

         // Delay the deletion to ensure the download starts
         setTimeout(function () {
            var deleteAjax = new XMLHttpRequest();
            deleteAjax.open('POST', 'process_upload.php');
            deleteAjax.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            deleteAjax.send('action=delete&file=' + zipFileName);
         }, 1000); // Delay for 1 second

         isFileSplit = true; // Set the flag to true indicating that the file has been split
      }
   };
   ajax.send('action=split&file=' + uploadedFileName);
}

function progressHandler(event) {
   _('loaded_n_total').innerHTML = 'Uploaded ' + formatBytes(event.loaded) + ' of ' + formatBytes(event.total) + '<br><hr>';
   var percent = (event.loaded / event.total) * 100;
   _('progressBar').value = Math.round(percent);
   _('status').innerHTML = Math.round(percent) + '% uploaded... please wait';
}

function formatBytes(bytes, decimals = 2) {
   if (bytes === 0) return '0 Bytes';
   const k = 1024;
   const dm = decimals < 0 ? 0 : decimals;
   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
   const i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function errorHandler(event) {
   _('status').innerHTML = 'Upload Failed';
}

function abortHandler(event) {
   _('status').innerHTML = 'Upload Aborted';
}

function dragOverHandler(event) {
   event.preventDefault();
   _('file_drop_area').style.backgroundColor = '#f0f0f0';
}

function dropHandler(event) {
   event.preventDefault();
   _('file_drop_area').style.backgroundColor = 'transparent';
   var files = event.dataTransfer.files;
   _('file').files = files;
   uploadFile();
}
