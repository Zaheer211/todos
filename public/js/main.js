
const socket = io('http://localhost:3000');

socket.on('todoExpired', (todoId) => {
    // console.log($("#"+todoId+""));
    $("#"+todoId+"").remove();
    $('#totdoExpired').show();
    setTimeout(() => {
        $('#totdoExpired').hide();
    }, 5000)
});

$(function () {

    $('#datetimepicker1').datetimepicker();
    $("#todosForm").submit((e) => {
        // e.preventDefault();
        // console.log(e);
    });

    Array.from($(".timeRemaining")).forEach((element => {
        
        function updateTime(){
            let now = moment();
            element.innerHTML = now.to(element.dataset.time);
            setTimeout(() => {
                updateTime();
            }, 30000)
        }
        updateTime();
    }));

});


