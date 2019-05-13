$(document).ready(function () {
    //hides dropdown content
    $(".search_posts").hide();

    //unhides first option content
    $("#option1").show();

    //listen to dropdown for change
    $("#search_filter").change(function () {
        console.log('changed!');
        //rehide content on change
        $('.search_posts').hide();
        //unhides current item
        $('#' + $(this).val()).show();
    });

});