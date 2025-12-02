// 전역 변수로 세대명 리스트를 관리 (초기값 설정)
let HOUSE_NAMES = ["301호", "302호"]; 

document.addEventListener('DOMContentLoaded', () => {
    // 세대명 관리는 로컬 저장소에서 불러온 후 시작해야 함
    const savedNames = localStorage.getItem('house_names');
    if (savedNames) {
        HOUSE_NAMES = JSON.parse(savedNames);
    }
    
    // 돔이 로드된 후 세대별 입력 폼을 동적으로 생성
    createHouseInputs(); 
    
    // 이벤트 리스너 연결
    document.getElementById('calculate-btn').addEventListener('click', runCalculation);
    document.getElementById('add-house-btn').addEventListener('click', addHouse);
    
    // 새로 추가된 기능: 화면 캡처 및 기록 불러오기
    document.getElementById('capture-btn').addEventListener('click', captureResult);
    loadHistory(); 
    
    updateHouseListDisplay(); 
});

// **======================= 세대 관리 기능 (수정) =======================**

function saveHouseNames() {
    localStorage.setItem('house_names', JSON.stringify(HOUSE_NAMES));
}

// addHouse 함수 수정
function addHouse() {
    const input = document.getElementById('new-house-name');
    const newName = input.value.trim();
    
    if (newName && !HOUSE_NAMES.includes(newName)) {
        // 1. 현재 입력된 모든 데이터를 수집합니다.
        const currentInputs = getCurrentHouseInputs(); 
        
        HOUSE_NAMES.push(newName);
        input.value = ''; 
        saveHouseNames(); 
        
        // 2. 수집된 데이터를 바탕으로 폼을 재생성합니다.
        createHouseInputs({ houseInputs: currentInputs }); 
        updateHouseListDisplay(); 
    } else if (HOUSE_NAMES.includes(newName)) {
        alert("이미 존재하는 호실 이름입니다.");
    }
}

// removeHouse 함수 수정
function removeHouse(houseId) {
    if (confirm(`정말로 ${houseId}를 삭제하시겠습니까?`)) {
        // 1. 현재 입력된 모든 데이터를 수집합니다.
        const currentInputs = getCurrentHouseInputs();
        
        HOUSE_NAMES = HOUSE_NAMES.filter(name => name !== houseId);
        saveHouseNames(); 
        
        // 2. 수집된 데이터를 바탕으로 폼을 재생성합니다.
        createHouseInputs({ houseInputs: currentInputs }); 
        updateHouseListDisplay();
    }
}

function updateHouseListDisplay() {
    document.getElementById('current-house-list').textContent = HOUSE_NAMES.join(', ');
}

// createHouseInputs 함수는 이제 저장된 지침을 채우는 기능도 포함합니다.
// createHouseInputs 함수 수정
// data 인수를 통해 복원할 이전 입력값들을 전달받습니다.
function createHouseInputs(data = {}) {
    const area = document.getElementById('houses-input-area');
    area.innerHTML = '<div class="section-title">🏠 세대별 상세 입력</div>';

    // generalInputs 복원은 여기서 필요 없으므로 houseInputs만 처리합니다.
    const houseInputsToRestore = data.houseInputs || getCurrentHouseInputs(); 
    
    HOUSE_NAMES.forEach(houseId => {
        // 복원할 데이터에서 해당 호실의 데이터를 찾습니다.
        const houseData = houseInputsToRestore.find(h => h.houseId === houseId) || {};
        
        // **⭐ 여기서 value 속성에 복원된 데이터를 사용합니다.**
        const html = `
            <div class="house-input-container" data-house-id="${houseId}">
                <h3>${houseId}</h3>
                
                <div class="section-title" style="margin-top: 10px;">수도 계량기 지침</div>
                
                <div class="water-meter-group">
                    <div>
                        <label>이전 달 안쪽</label>
                        <input type="number" class="prev-inner" data-house="${houseId}" placeholder="이전 안" required value="${houseData.prevInner || ''}">
                    </div>
                    <div>
                        <label>이전 달 바깥쪽</label>
                        <input type="number" class="prev-outer" data-house="${houseId}" placeholder="이전 밖" required value="${houseData.prevOuter || ''}">
                    </div>
                </div>
                <div class="water-meter-group">
                    <div>
                        <label>이번 달 안쪽</label>
                        <input type="number" class="current-inner" data-house="${houseId}" placeholder="이번 안" required value="${houseData.currentInner || ''}">
                    </div>
                    <div>
                        <label>이번 달 바깥쪽</label>
                        <input type="number" class="current-outer" data-house="${houseId}" placeholder="이번 밖" required value="${houseData.currentOuter || ''}">
                    </div>
                </div>
                <button type="button" onclick="removeHouse('${houseId}')" style="margin-top: 10px; padding: 5px; background-color: #dc3545; font-size: 0.8em;">호실 삭제</button>
            </div>
        `;
        area.insertAdjacentHTML('beforeend', html);
    });
    
    // applyHistory로 복원된 데이터가 generalInputs도 가지고 있다면 채워 넣습니다.
    if (data.generalInputs) {
        document.getElementById('total-water').value = data.generalInputs.totalWater || '';
        document.getElementById('total-electric').value = data.generalInputs.totalElectric || '';
        document.getElementById('fixed-maint-fee').value = data.generalInputs.fixedMaintFee || '';
    }
}

// **======================= 계산 및 조정 로직 (변동 없음) =======================**

function runCalculation() {
    // 1. 데이터 수집 (총괄 요금, 관리비)
    const totalWaterBill = parseFloat(document.getElementById('total-water').value) || 0;
    const totalElectricityBill = parseFloat(document.getElementById('total-electric').value) || 0;
    const fixedMaintFee = parseFloat(document.getElementById('fixed-maint-fee').value) || 0;

    if (totalWaterBill === 0 || totalElectricityBill === 0 || fixedMaintFee === 0 || HOUSE_NAMES.length === 0) {
        alert("총 요금, 관리비, 호실 리스트를 모두 확인해주세요.");
        return;
    }
    
    // 2. 세대별 데이터 수집 및 사용량 계산
    let housesData = [];
    let totalUsageSum = 0;
    const HOUSE_COUNT = HOUSE_NAMES.length;
    
    // 입력 정보를 저장하기 위한 별도 배열
    const houseInputs = []; 

    HOUSE_NAMES.forEach(houseId => {
        const prevInner = parseFloat(document.querySelector(`.prev-inner[data-house="${houseId}"]`).value) || 0;
        const prevOuter = parseFloat(document.querySelector(`.prev-outer[data-house="${houseId}"]`).value) || 0;
        const currentInner = parseFloat(document.querySelector(`.current-inner[data-house="${houseId}"]`).value) || 0;
        const currentOuter = parseFloat(document.querySelector(`.current-outer[data-house="${houseId}"]`).value) || 0;
        
        const usage = (currentInner - prevInner) + (currentOuter - prevOuter);
        totalUsageSum += usage;

        housesData.push({
            houseId,
            fixedMaintFee,
            usage,
        });
        
        // 입력 정보 저장
        houseInputs.push({
            houseId, prevInner, prevOuter, currentInner, currentOuter,
        });
    });
    
    if (totalUsageSum === 0) {
        alert("총 수도 사용량이 0입니다. 계량기 지침을 확인해주세요.");
        return;
    }

    // 3. 요금 분배 및 조정 (adjustCombinedCost 호출)
    const electricCostPerHouse = totalElectricityBill / HOUSE_COUNT;

    housesData.forEach(house => {
        const initialWaterCost = totalWaterBill * (house.usage / totalUsageSum);
        house.initialCombinedCost = initialWaterCost + electricCostPerHouse;
    });

    housesData = adjustCombinedCost(housesData, totalWaterBill + totalElectricityBill);
    
    // 4. 최종 출력 및 저장
    displayResults(housesData);
    
    // 저장할 입력 데이터 객체 생성
    const generalInputs = {
        totalWater: totalWaterBill,
        totalElectric: totalElectricityBill,
        fixedMaintFee: fixedMaintFee,
    };
    
    // 입력 정보 전체를 localStorage에 저장
    saveHistory(generalInputs, houseInputs, housesData);
}

// adjustCombinedCost 함수는 이전 답변과 동일하게 유지됩니다.
function adjustCombinedCost(housesData, expectedTotal) {
    // ... (로직은 이전 답변과 동일) ...
    housesData.forEach(house => {
        house.roundedCombinedCost = Math.round(house.initialCombinedCost / 10) * 10;
        house.roundingError = house.initialCombinedCost - house.roundedCombinedCost; 
    });

    const sumOfRoundedCost = housesData.reduce((sum, house) => sum + house.roundedCombinedCost, 0);
    let difference = expectedTotal - sumOfRoundedCost; 

    const groups = {}; 
    housesData.forEach(house => {
        const errorKey = house.roundingError.toFixed(4); 
        const key = `${house.usage}-${errorKey}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(house);
    });

    if (difference > 0) {
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            return parseFloat(b.split('-')[1]) - parseFloat(a.split('-')[1]); 
        });

        for (const key of sortedKeys) {
            if (difference <= 0) break;
            const group = groups[key];
            const groupAdjustment = group.length * 10; 
            
            if (difference >= groupAdjustment) {
                group.forEach(h => h.finalCombinedCost = h.roundedCombinedCost + 10);
                difference -= groupAdjustment;
            } else {
                group.forEach(h => h.finalCombinedCost = h.roundedCombinedCost);
            }
        }
    } 
    else if (difference < 0) {
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            return parseFloat(a.split('-')[1]) - parseFloat(b.split('-')[1]); 
        });

        for (const key of sortedKeys) {
            if (difference >= 0) break;
            const group = groups[key];
            const groupAdjustment = group.length * 10; 
            
            if (difference + groupAdjustment <= 0) {
                group.forEach(h => h.finalCombinedCost = h.roundedCombinedCost - 10);
                difference += groupAdjustment;
            } else {
                group.forEach(h => h.finalCombinedCost = h.roundedCombinedCost);
            }
        }
    }
    
    housesData.forEach(house => {
        if (!house.finalCombinedCost) {
            house.finalCombinedCost = house.roundedCombinedCost;
        }
        house.finalHouseBill = house.finalCombinedCost + house.fixedMaintFee;
    });
    
    return housesData;
}


function displayResults(housesData) {
    const tbody = document.getElementById('result-tbody');
    tbody.innerHTML = '';
    
    housesData.forEach(house => {
        const row = `
            <tr>
                <td>${house.houseId}</td>
                <td>${house.usage.toFixed(0)}</td>
                <td>${house.finalCombinedCost.toLocaleString()} 원</td>
                <td>${house.finalHouseBill.toLocaleString()} 원</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });

    document.getElementById('results').style.display = 'block'; 
}

// **======================= LocalStorage 기록 관리 (수정) =======================**

// 계산 결과를 localStorage에 저장하는 함수 (입력 정보를 저장하도록 수정)
function saveHistory(generalInputs, houseInputs, results) {
    const history = JSON.parse(localStorage.getItem('calc_history') || '[]');
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    history.unshift({
        timestamp,
        generalInputs, // 총괄 요금 및 관리비
        houseInputs,   // 세대별 계량기 지침
        houseNames: HOUSE_NAMES, // 세대명 구성
        results // (선택적) 계산 결과도 함께 저장 (출력 시 정보 제공용)
    });

    if (history.length > 10) {
        history.pop(); 
    }

    localStorage.setItem('calc_history', JSON.stringify(history));
    loadHistory(); // 저장 후 목록 갱신
}

// 저장된 기록을 불러와 화면에 표시하는 함수 (수정)
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('calc_history') || '[]');
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #666;">저장된 정산 기록이 없습니다.</p>';
        return;
    }

    history.forEach((record, index) => {
        const totalBill = record.generalInputs.totalWater + record.generalInputs.totalElectric;
        const listItem = document.createElement('li');
        listItem.style.marginBottom = '15px';
        listItem.style.padding = '10px';
        listItem.style.borderBottom = '1px dashed #ccc';
        
        listItem.innerHTML = `
            <strong>${record.timestamp} 정산 (${record.houseNames.length} 세대)</strong>
            <p style="font-size: 0.9em; margin: 5px 0 0 10px;">
                총 고지 요금: ${totalBill.toLocaleString()}원 / 세대당 관리비: ${record.generalInputs.fixedMaintFee.toLocaleString()}원
            </p>
            <button onclick="applyHistory(${index})" style="width: auto; padding: 5px 10px; margin-left: 10px; background-color: #007bff; color: white; border: none; border-radius: 3px; font-size: 0.8em; cursor: pointer;">입력 정보 불러오기</button>
            <button onclick="deleteHistoryRecord(${index})" style="width: auto; padding: 5px 10px; margin-left: 5px; background-color: #f44336; color: white; border: none; border-radius: 3px; font-size: 0.8em; cursor: pointer;">기록 삭제</button>
        `;
        historyList.appendChild(listItem);
    });
}

// **신규 기능: 저장된 입력 정보를 현재 폼에 적용하는 함수**
function applyHistory(index) {
    if (!confirm("저장된 입력 정보로 현재 화면을 덮어쓰시겠습니까?")) return;
    
    const history = JSON.parse(localStorage.getItem('calc_history') || '[]');
    const record = history[index];
    
    // 1. 세대명 복원 및 저장
    HOUSE_NAMES = record.houseNames;
    saveHouseNames();
    updateHouseListDisplay();
    
    // 2. 입력 폼 재생성 및 데이터 채우기
    createHouseInputs({
        generalInputs: record.generalInputs,
        houseInputs: record.houseInputs
    });
    
    // 3. 결과 창 숨기기 (새로운 계산을 준비)
    document.getElementById('results').style.display = 'none'; 
    
    alert("입력 정보가 성공적으로 불러와졌습니다. '계산 및 결과 보기' 버튼을 눌러주세요.");
}

function deleteHistoryRecord(index) {
    if (!confirm("이 기록을 정말로 삭제하시겠습니까?")) return;
    
    const history = JSON.parse(localStorage.getItem('calc_history') || '[]');
    history.splice(index, 1); 
    localStorage.setItem('calc_history', JSON.stringify(history));
    loadHistory(); 
}


// **======================= 화면 캡처 기능 (휴대폰 저장 방식) =======================**

function captureResult() {
    const resultsSection = document.getElementById('results');

    if (resultsSection.style.display === 'none') {
        alert("계산을 먼저 실행하여 결과를 화면에 표시해주세요.");
        return;
    }

    // html2canvas 실행: 결과 영역을 캔버스로 변환
    html2canvas(resultsSection, {
        scale: 2, 
        backgroundColor: '#e2ffe8', 
        useCORS: true // 외부 이미지(만약 있다면) 로드 허용
    }).then(canvas => {
        // 이미지를 PNG 데이터 URL로 변환
        const image = canvas.toDataURL('image/png');
        
        // 캡처된 이미지를 파일로 다운로드 (이것이 웹 기술에서 휴대폰에 저장하는 표준 방식)
        const link = document.createElement('a');
        link.href = image;
        // 파일명을 현재 날짜로 지정
        link.download = `빌라관리비_정산결과_${new Date().toISOString().slice(0, 10)}.png`; 
        
        // 링크를 클릭하여 다운로드를 실행
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert("정산 결과 화면이 이미지 파일로 다운로드됩니다. 휴대폰의 '다운로드' 폴더 또는 '갤러리'에서 확인해주세요.");
    }).catch(error => {
        console.error("화면 캡처 중 오류 발생:", error);
        alert("화면 캡처에 실패했습니다. (콘솔 로그 확인)");
    });
}

// 현재 화면에 입력된 모든 계량기 지침 정보를 수집하여 객체 배열로 반환합니다.
function getCurrentHouseInputs() {
    const inputs = [];
    
    // 현재 DOM에 존재하는 모든 하우스 입력 컨테이너를 찾습니다.
    const containers = document.querySelectorAll('.house-input-container');
    
    containers.forEach(container => {
        const houseId = container.getAttribute('data-house-id');
        
        inputs.push({
            houseId: houseId,
            // input 요소를 찾아 값을 읽어옵니다. 값이 없으면 빈 문자열('') 반환.
            prevInner: container.querySelector('.prev-inner').value,
            prevOuter: container.querySelector('.prev-outer').value,
            currentInner: container.querySelector('.current-inner').value,
            currentOuter: container.querySelector('.current-outer').value,
        });
    });
    return inputs;
}