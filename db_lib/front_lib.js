

/** 숫자 카운트 **/

const randomChracter = (length) => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let i = 0;
    while (i < length) {
        i++;
        text = text + possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

const changeArrayOrder = function (list, targetIdx, moveValue) {
    if (list.length < 0) return;
    const newPosition = targetIdx + moveValue;
    if (newPosition < 0 || newPosition >= list.length) return;
    const tempList = JSON.parse(JSON.stringify(list));
    const target = tempList.splice(targetIdx, 1)[0];
    tempList.splice(newPosition, 0, target);
    return tempList;
};

const counter = ($counter, max, rapid) => {
    let now = max;
    const handle = setInterval(() => {
        $counter.innerHTML = numberWithCommas(Math.ceil(max - now));

        // 목표수치에 도달하면 정지
        if (now < 1) {
            clearInterval(handle);
        }

        // 증가되는 값이 계속하여 작아짐
        const step = now / 10;

        // 값을 적용시키면서 다음 차례에 영향을 끼침
        now -= step;
    }, rapid);
}


/** 세자리 콤마 **/
const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


const cliboardCopy = (text) => {
    // 임시의 textarea 생성
    const $textarea = document.createElement("textarea");

    // body 요소에 존재해야 복사가 진행됨
    document.body.appendChild($textarea);

    // 복사할 특정 텍스트를 임시의 textarea에 넣어주고 모두 셀렉션 상태
    $textarea.value = text;
    $textarea.select();

    // 복사 후 textarea 지우기
    document.execCommand('copy');
    document.body.removeChild($textarea);
}
