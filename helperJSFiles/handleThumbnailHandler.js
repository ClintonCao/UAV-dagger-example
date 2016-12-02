$( document ).ready(function() {
    $("[rel='tooltip']").tooltip();

    $('.thumbnail').css("background-color", "transparent ")

    $('.column').hover(
        function(){
            $(this).find('.thumbnail').css("background-color", "#339df9")
        },
        function(){
            $(this).find('.thumbnail').css("background-color", "transparent ")
        }
    );
});
