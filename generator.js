import { extractNumbersFromDream } from './assets/dream_db.js';

export class LottoGenerator {
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
            // Shuffle pool
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
                // Allow 2:4, 3:3, 4:2 odd/even ratio
                if ((odds === 2 && evens === 4) || (odds === 3 && evens === 3) || (odds === 4 && evens === 2)) {
                    return result;
                }
            }
            attempts++;
        }
        // Fallback
        return this.generateBase(included, excluded);
    }

    generateDream(dreamText, included = [], excluded = []) {
        let dreamNums = extractNumbersFromDream(dreamText);
        
        // Remove excluded from dreamNums
        dreamNums = dreamNums.filter(n => !excluded.includes(n));
        
        let customIncluded = [...new Set([...included, ...dreamNums])];
        
        // If dream gives us too many, randomly pick subset
        if (customIncluded.length > this.drawCount) {
             let shuffled = customIncluded.sort(() => 0.5 - Math.random());
             customIncluded = shuffled.slice(0, this.drawCount);
        }

        return this.generateBase(customIncluded, excluded);
    }
}
