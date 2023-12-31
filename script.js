let canvas = document.createElement("canvas");
let video = document.getElementById("showVideo");
if ((localStorage.getItem("ClockPiP-Height") ?? "") !== "") document.getElementById("canvasHeight").value = localStorage.getItem("ClockPiP-Height");
if ((localStorage.getItem("ClockPiP-Width") ?? "") !== "") document.getElementById("canvasWidth").value = localStorage.getItem("ClockPiP-Width");
function updateCanvasSize() {
    canvas.width = isNaN(parseInt(document.getElementById("canvasWidth").value)) ? 1920 : parseInt(document.getElementById("canvasWidth").value);
    canvas.height = isNaN(parseInt(document.getElementById("canvasHeight").value)) ? 1080 : parseInt(document.getElementById("canvasHeight").value);
}
updateCanvasSize();
if ("serviceWorker" in navigator) {
    let registration;
    const registerServiceWorker = async () => {
        registration = await navigator.serviceWorker.register('./service-worker.js', { scope: `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"))}/` });
    };
    registerServiceWorker();
}
let appVersion = "1.1.0";
fetch("./clockpip-updatecode", { cache: "no-store" }).then((res) => res.text().then((text) => { if (text.replace("\n", "") !== appVersion) if (confirm(`There's a new version of ClockPiP. Do you want to update? [${appVersion} --> ${text.replace("\n", "")}]`)) { caches.delete("clockpip-cache"); location.reload(true); } }).catch((e) => { console.error(e) })).catch((e) => console.error(e));
document.getElementById("version").textContent = appVersion;
let context = canvas.getContext("2d");
let isCustomImage = false;
document.getElementById("forcePlay").addEventListener("click", () => {
    video.play();
})
let is59Seconds = false;
function generateCanvas(setNewTimeout) {
    if (is59Seconds && new Date().getMilliseconds() < (document.getElementById("quickUpdate").checked ? 900 : 949) && !setNewTimeout) {
        setTimeout(() => {is59Seconds = false}, 1400);
        setTimeout(() => {generateCanvas()}, document.getElementById("quickUpdate").checked ? 29 : 57);
        return;
    }
    if (!isCustomImage) {
        context.fillStyle = document.getElementById("backgroundColor").value;
        context.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        let aspectRatios = [canvas.width / canvas.height, isCustomImage.width / isCustomImage.height];
        let imgInfoContainer = {};
        if (aspectRatios[1] > aspectRatios[0]) {
            imgInfoContainer.scaleFactor = canvas.height / isCustomImage.height;
            let scaledWidth = isCustomImage.width * imgInfoContainer.scaleFactor;
            imgInfoContainer.x = (canvas.width - scaledWidth) / 2;
            imgInfoContainer.y = 0;
            imgInfoContainer.yx = 0;
        } else {
            imgInfoContainer.scaleFactor = canvas.width / isCustomImage.width;
            let scaledHeight = isCustomImage.height * imgInfoContainer.scaleFactor;
            imgInfoContainer.y = (canvas.height - scaledHeight) / 2;
            imgInfoContainer.x = 0;
                  
        }
        context.drawImage(isCustomImage, imgInfoContainer.x, imgInfoContainer.y, isCustomImage.width * imgInfoContainer.scaleFactor, isCustomImage.height * imgInfoContainer.scaleFactor);
    }
    context.fillStyle = document.getElementById("textColor").value;
    context.font = `${document.getElementById("bold").checked ? "bold " : ""}${document.getElementById("italic").checked ? "italic " : ""}${document.getElementById("fontSize").value}px ${document.getElementById("font").value}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    let date = new Date()
    if (date.getSeconds() === 59 && date.getMilliseconds() > document.getElementById("quickUpdate").checked ? 900 : 949) date = new Date(date.getTime() + 100);
    let dateStr = date.toLocaleDateString();
        date = date.toTimeString().substring(0, 9).trim();
    context.fillText(date, canvas.width / 2, canvas.height / 2);
    if (document.getElementById("underline").checked) context.fillRect(((canvas.width / 2) - (context.measureText(date).width / 2)), ((canvas.height / 2) + (parseInt(document.getElementById("fontSize").value) / 2)), context.measureText(date).width, parseInt(document.getElementById("fontSize").value) / 10);
if (document.getElementById("showDate").checked) {
        context.font = `${document.getElementById("bold").checked ? "bold " : ""}${document.getElementById("italic").checked ? "italic " : ""}${document.getElementById("dateSize").value}px ${document.getElementById("font").value}`;
        context.textAlign = "left";
        context.textBaseline = "top";    
        let drawCoords = [document.getElementById("widthLocation").value === "left" ? (canvas.width * 5 / 100) : document.getElementById("widthLocation").value === "center" ? ((canvas.width / 2) - (context.measureText(dateStr).width / 2)) : (canvas.width - (canvas.width * 5 / 100) - context.measureText(dateStr).width), document.getElementById("heightLocation").value === "top" ? (canvas.height * 5 / 100) : canvas.height - (canvas.height * 5 / 100) - context.measureText(dateStr).emHeightDescent];
        context.fillText(dateStr, drawCoords[0], drawCoords[1]);
    }
    if (new Date().getSeconds() === 59) {
        is59Seconds = true;
        setTimeout(() => {generateCanvas()}, document.getElementById("quickUpdate").checked ? 29 : 57);
    }
    if (setNewTimeout) setTimeout(() => {generateCanvas(true)}, 1000 - new Date().getMilliseconds());
}
addBackgroundImage();
generateCanvas(true);
video.srcObject = canvas.captureStream();
video.load();
for (let item of document.querySelectorAll("[data-save]")) item.addEventListener("change", () => {
    let parseItem = JSON.parse(localStorage.getItem("ClockPiP-InputVal") ?? "{}")
    parseItem[item.getAttribute("data-save")] = item.type === "checkbox" ? item.checked : item.value;
    localStorage.setItem("ClockPiP-InputVal", JSON.stringify(parseItem));
})
let getPrevSettings = JSON.parse(localStorage.getItem("ClockPiP-InputVal") ?? "{}");
for (let item in getPrevSettings) if ((document.querySelector(`[data-save=${item}]`) ?? "") !== "") document.querySelector(`[data-save=${item}]`)[document.querySelector(`[data-save=${item}]`).type === "checkbox" ? "checked" : "value"] = getPrevSettings[item];
document.getElementById("enablePip").addEventListener("click", () => {
    video.requestPictureInPicture();
})
document.getElementById("addBackgroundImg").addEventListener("click", () => {
    let input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
        let read = new FileReader();
        read.onload = () => {
            let img = new Image();
            img.onload = () => {
                function resizeImg(quality, ratio) {
                    let canvas = document.createElement("canvas");
                    canvas.width = img.width * ratio;
                    canvas.height = img.height * ratio;
                    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                    let dataUrl = canvas.toDataURL(document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp") ? "image/webp" : "image/jpeg", quality);
                    dataUrl.length > 1_333_333 ? resizeImg(quality - 0.5, ratio - 0.5) : localStorage.setItem("ClockPiP-CustomImg", dataUrl);
                }
                resizeImg(0.9, 1);
                addBackgroundImage();
            }
            img.src = read.result;
        }
        read.readAsDataURL(input.files[0]);
    }
    input.click();
})
function addBackgroundImage() {
    let img = localStorage.getItem("ClockPiP-CustomImg");
    if ((img ?? "") === "") return;
    isCustomImage = new Image();
    isCustomImage.src = img;
}
document.getElementById("removeBackgroundImg").addEventListener("click", () => {
    localStorage.removeItem("ClockPiP-CustomImg");
    isCustomImage = false;
})
for (let item of document.querySelectorAll("[data-export]")) item.addEventListener("click", () => {
    canvas.toBlob((blob) => {
        downlaodContent(blob, item.getAttribute("data-export") === "jpeg" ? "jpg" : item.getAttribute("data-export"));
    }, `image/${item.getAttribute("data-export")}`, parseFloat(document.getElementById("quality")));
})
for (let item of document.querySelectorAll("[data-record]")) item.addEventListener("click", () => {
    item.disabled = true;
    let rec = [];
    let stream = canvas.captureStream(parseInt(document.getElementById("fps").value));
    let mediaRecorder = new MediaRecorder(stream, {
        mimeType: item.getAttribute("data-mime"),
        bitsPerSecond: (parseInt(document.getElementById("bitrate").value) * 1024)
    })
    mediaRecorder.start(parseInt(document.getElementById("maxinumVideoLength").value));
    mediaRecorder.ondataavailable = (e) => {
        rec.push(e.data);
        if (mediaRecorder.state === "recording") mediaRecorder.stop();
    }
    mediaRecorder.onstop = (e) => {
        item.disabled = false;
        downlaodContent(new Blob(rec, {type: `video/${item.getAttribute("data-record")}`}), item.getAttribute("data-record").substring(item.getAttribute("data-record").indexOf("/") + 1));
    }
});
function downlaodContent(blob, extension) {
    let a = document.getElementById("downloadRestart");
    a.href = URL.createObjectURL(blob);
    a.download = `ClockImg.${extension}`;
    a.style.display = "";
    a.click();
}
(MediaRecorder.isTypeSupported("video/webm;codecs=vp9") || MediaRecorder.isTypeSupported("video/webm")) ? document.querySelector("[data-record=webm]").setAttribute("data-mime", MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm") : document.querySelector("[data-record=webm]").disabled = true;
MediaRecorder.isTypeSupported("video/mp4") ? document.querySelector("[data-record=mp4]").setAttribute("data-mime", "video/mp4") : document.querySelector("[data-record=mp4]").disabled = true;
function opacityAdd(item) {
    item.style.display = "block";
    setTimeout(() => {item.style.opacity = 1}, 15);
}
function opacityRemove(item) {
    item.style.opacity = 0;
    setTimeout(() => {
        item.style.display = "none";
    }, 255);
}
document.getElementById("exportImg").addEventListener("change", () => {
    for (let item of document.querySelectorAll("[data-exportDiv]")) item.getAttribute("data-exportDiv") === document.getElementById("exportImg").value ? setTimeout(() => {opacityAdd(item)}, 260) : opacityRemove(item);
})
document.getElementById("deviceWidth").addEventListener("click", () => {
    document.getElementById("canvasWidth").value = window.outerWidth;
    document.getElementById("canvasHeight").value = window.outerHeight;
    saveSize();
    updateCanvasSize();
})
function saveSize() {
    localStorage.setItem("ClockPiP-Width", document.getElementById("canvasWidth").value);
    localStorage.setItem("ClockPiP-Height", document.getElementById("canvasHeight").value);
}
for (let item of ["canvasWidth", "canvasHeight"]) document.getElementById(item).addEventListener("input", () => {
    saveSize();
    updateCanvasSize();
});
document.querySelector("[data-export=webp]").disabled = !document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
let themeObj = {
    isDark: true,
    dark: {
        background: "#201f1f",
        option: "#333333",
        text: "#f0f0f0",
        accent: "#2f79c3"
    },
    light: {
        background: "#f0f0f0",
        option: "#d2d2d2",
        text: "#201f1f",
        accent: "#68a0d7"
    }
}
document.getElementById("changeTheme").addEventListener("click", () => {
    themeObj.isDark = !themeObj.isDark;
    for (let item in themeObj.dark) document.documentElement.style.setProperty(`--${item}`, themeObj[themeObj.isDark ? "dark" : "light"][item]);
    localStorage.setItem("ClockPiP-PreferredTheme", themeObj.isDark ? "a" : "b");
})
if (localStorage.getItem("ClockPiP-PreferredTheme") === "b") document.getElementById("changeTheme").click();
document.getElementById("cssStylesheet").addEventListener("input", () => {
    localStorage.setItem("ClockPiP-CustomStylesheet", document.getElementById("cssStylesheet").value);
    document.getElementById("customStylesheet").href = document.getElementById("cssStylesheet").value;
})
if (window.location.hash.indexOf("noextcss") !== -1) localStorage.removeItem("ClockPiP-CustomStylesheet"); else {
    document.getElementById("cssStylesheet").value = localStorage.getItem("ClockPiP-CustomStylesheet")
    document.getElementById("customStylesheet").href = document.getElementById("cssStylesheet").value;
}
let imgStore;
fetch("./assets/icon.json").then((res) => {res.json().then((json) => {imgStore = json;})})
function getImg(icon, item) {
    if ((imgStore ?? "") === "") {
        setTimeout(() => {getImg(icon, item)}, 50);
        return;
    }
    item.src = URL.createObjectURL(new Blob([imgStore[icon].replaceAll("#212121", getComputedStyle(document.body).getPropertyValue("--accent"))], {type: "image/svg+xml"}));
}
for (let item of document.querySelectorAll("[data-img]")) getImg(item.getAttribute("data-img"), item);
for (let item of document.querySelectorAll("[data-canvasrefresh]")) item.addEventListener("change", () => {generateCanvas()})