$(document).ready(function () {
    
    function post(formData) {
        var jsonresult = "";
        $.ajax({
            contentType: false,
            url: 'http://localhost:62322/home/ConvertCsvFileToJsonObjectv2',
            type: 'POST',
            data: formData,
            processData: false,
            async: false,
            crossDomain: true,
            dataType: 'json', // added data type
            success: function (response, status, jqXHR) {
                jsonresult = response;
                console.log(jsonresult);
            }
        });
        return $.parseJSON(jsonresult);
    }
    function get(url) {
        var result = "";
        $.ajax({
            contentType: "application/json",
            url: url,
            type: 'GET',
            async: false,
            crossDomain: true,
            dataType: 'json', 
            success: function (data) {
                result = data;
            }
        });
        return result;
    }
    $("#btnCSV").bind('click', function () {
        var fileInput = document.getElementById('csvfile');
        var csvfile = fileInput.files[0];
        var formData = new FormData();
        formData.append('csvfile', csvfile);

        var postjson = post(formData);
        var updategrid = new kendo.data.DataSource({
            data: postjson,
            autoSync: true,
            pageSize: 10
        });
        $("#demogrid").kendoGrid({
            dataSource: updategrid,
            pageable: true,
            height: '250px',
            columns: [
                { field: "policy_ID", title: "Policy ID" }, { field: "point_latitude", title: "Latitude" }, { field: "point_longitude", title: "Longitude" }
            ]
        });
    });
});
$(window).load(function () {
    var grid = $("#demogrid").data("kendoGrid");
});  