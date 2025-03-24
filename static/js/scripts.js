document.addEventListener("DOMContentLoaded", function () {
    console.log("页面加载完成！");
});


function updateTime() {
    let now = new Date();
    
    let options = {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    };

    let formattedTime = now.toLocaleDateString("fr-FR", options);
    document.getElementById("clock").textContent = formattedTime;
}

// 立即执行一次，避免页面加载时为空
updateTime();
// 每秒更新时间
setInterval(updateTime, 1000);

