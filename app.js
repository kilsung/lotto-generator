// --- Dream Dictionary ---
const dreamDictionary = {
    "조상": [1, 2],
    "돼지": [12, 8],
    "돈": [10, 15],
    "똥": [7, 18],
    "물": [14],
    "불": [4, 30],
    "피": [3],
    "뱀": [11],
    "용": [19],
    "호랑이": [24],
    "개": [33],
    "고양이": [21],
    "아기": [6],
    "자동차": [28],
    "비행기": [39],
    "연예인": [42],
    "대통령": [1, 45],
    "황금": [17],
    "반지": [27],
    "물고기": [13, 20],
    "새": [41],
    "거북이": [31],
    "죽음": [44],
    "머리카락": [22],
    "옷": [29],
    "산": [32],
    "바다": [35],
    "달": [2],
    "별": [38]
};

function extractNumbersFromDream(dreamText) {
    let numbers = new Set();
    for (const [keyword, nums] of Object.entries(dreamDictionary)) {
        if (dreamText.includes(keyword)) {
            nums.forEach(n => numbers.add(n));
        }
    }
    
    if (numbers.size === 0 && dreamText.trim().length > 0) {
        let hash = 0;
        for (let i = 0; i < dreamText.length; i++) {
            let char = dreamText.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        let pseudoSeed = Math.abs(hash);
        numbers.add((pseudoSeed % 45) + 1);
        numbers.add(((pseudoSeed * 3) % 45) + 1);
    }
    
    return Array.from(numbers);
}

// --- Generator ---
class LottoGenerator {
    constructor() {
        this.maxNumber = 45;
        this.drawCount = 6;
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateBase(included = [], excluded = []) {
        let pool = [];
        for (let i = 1; i <= this.maxNumber; i++) {
            if (!excluded.includes(i) && !included.includes(i)) {
                pool.push(i);
            }
        }

        let result = [...included];
        let remainingToDraw = this.drawCount - result.length;

        if (remainingToDraw > 0) {
            for (let i = pool.length - 1; i > 0; i--) {
                const j = this.getRandomInt(0, i);
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            result = result.concat(pool.slice(0, remainingToDraw));
        }
        return result.sort((a, b) => a - b);
    }

    generateRandom(included = [], excluded = []) {
        return this.generateBase(included, excluded);
    }

    generateBalanced(included = [], excluded = []) {
        let attempts = 0;
        while (attempts < 1000) {
            let result = this.generateBase(included, excluded);
            let sum = result.reduce((a, b) => a + b, 0);
            let odds = result.filter(n => n % 2 !== 0).length;
            let evens = result.filter(n => n % 2 === 0).length;

            if (sum >= 100 && sum <= 180) {
                if ((odds === 2 && evens === 4) || (odds === 3 && evens === 3) || (odds === 4 && evens === 2)) {
                    return result;
                }
            }
            attempts++;
        }
        return this.generateBase(included, excluded);
    }

    generateDream(dreamText, included = [], excluded = []) {
        let dreamNums = extractNumbersFromDream(dreamText);
        dreamNums = dreamNums.filter(n => !excluded.includes(n));
        let customIncluded = [...new Set([...included, ...dreamNums])];
        if (customIncluded.length > this.drawCount) {
             let shuffled = customIncluded.sort(() => 0.5 - Math.random());
             customIncluded = shuffled.slice(0, this.drawCount);
        }
        return this.generateBase(customIncluded, excluded);
    }
}

// --- App Logic ---
const generator = new LottoGenerator();

const modeSelect = document.getElementById('mode-select');
const dreamInputGroup = document.getElementById('dream-input-group');
const dreamText = document.getElementById('dream-text');
const generateBtn = document.getElementById('generate-btn');
const resultDisplay = document.getElementById('result-display');
const statDisplay = document.getElementById('stat-display');
const historyList = document.getElementById('history-list');

let historyStore = JSON.parse(localStorage.getItem('lottoHistory')) || [];

function init() {
    modeSelect.addEventListener('change', handleModeChange);
    generateBtn.addEventListener('click', handleGenerate);
    renderHistory();
    handleModeChange();
}

function handleModeChange() {
    if (modeSelect.value === 'dream') {
        dreamInputGroup.style.display = 'flex';
    } else {
        dreamInputGroup.style.display = 'none';
    }
}

function getBallColorClass(num) {
    if (num <= 10) return 'color-yellow';
    if (num <= 20) return 'color-blue';
    if (num <= 30) return 'color-red';
    if (num <= 40) return 'color-gray';
    return 'color-green';
}

function animateBalls(numbers) {
    resultDisplay.innerHTML = '';
    statDisplay.innerHTML = '';
    
    numbers.forEach((num, index) => {
        const ball = document.createElement('div');
        ball.className = `ball ${getBallColorClass(num)}`;
        ball.textContent = num;
        resultDisplay.appendChild(ball);
        
        setTimeout(() => {
            ball.classList.add('show');
        }, index * 200);
    });

    setTimeout(() => {
        showStats(numbers);
    }, numbers.length * 200 + 300);
}

function showStats(numbers) {
    const sum = numbers.reduce((a, b) => a + b, 0);
    const odds = numbers.filter(n => n % 2 !== 0).length;
    const evens = numbers.filter(n => n % 2 === 0).length;
    statDisplay.innerHTML = `총합: ${sum} | 홀짝비율: ${odds}:${evens}`;
}

function handleGenerate() {
    let result = [];
    const mode = modeSelect.value;

    if (mode === 'random') {
        result = generator.generateRandom();
    } else if (mode === 'balanced') {
        result = generator.generateBalanced();
    } else if (mode === 'dream') {
        const text = dreamText.value || "";
        result = generator.generateDream(text);
    }

    animateBalls(result);
    saveToHistory(result);
}

function saveToHistory(numbers) {
    historyStore.unshift({
        id: Date.now(),
        numbers: numbers,
        date: new Date().toLocaleString('ko-KR')
    });
    
    if (historyStore.length > 20) {
        historyStore.pop();
    }
    
    localStorage.setItem('lottoHistory', JSON.stringify(historyStore));
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    if (historyStore.length === 0) {
        historyList.innerHTML = '<li style="color: var(--text-muted); font-size: 0.9rem;">이력이 없습니다.</li>';
        return;
    }
    
    historyStore.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const ballsDiv = document.createElement('div');
        ballsDiv.className = 'history-balls';
        
        item.numbers.forEach(num => {
            const ball = document.createElement('div');
            ball.className = `history-ball ${getBallColorClass(num)}`;
            ball.textContent = num;
            ballsDiv.appendChild(ball);
        });
        
        const infoDiv = document.createElement('div');
        infoDiv.style.fontSize = '0.7rem';
        infoDiv.style.color = 'var(--text-muted)';
        
        try {
            const parts = item.date.split('. ');
            if (parts.length > 1) {
                infoDiv.textContent = parts.slice(1).join('. ');
            } else {
                infoDiv.textContent = item.date;
            }
        } catch(e) {
             infoDiv.textContent = item.date;
        }

        li.appendChild(ballsDiv);
        li.appendChild(infoDiv);
        historyList.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', init);
