// Santa Calling App - Main Application Logic

class SantaCallingApp {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isCallActive = false;
        this.conversationHistory = [];
        this.santaVoice = null;
        this.isProcessing = false;

        // UI Elements
        this.callButton = document.getElementById('callButton');
        this.hangUpButton = document.getElementById('hangUpButton');
        this.callStatus = document.getElementById('callStatus');
        this.messages = document.getElementById('messages');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.loadingContainer = document.getElementById('loadingContainer');
        this.santaAvatar = document.getElementById('santaAvatar');

        this.init();
    }

    init() {
        this.setupSnowEffect();
        this.initSpeechRecognition();
        this.initTextToSpeech();
        this.setupEventListeners();
        this.showMessage('info', 'Ready to call Santa! Click the button to start.');
    }

    setupSnowEffect() {
        const snowContainer = document.getElementById('snowContainer');
        const snowflakeCount = 50;

        for (let i = 0; i < snowflakeCount; i++) {
            const snowflake = document.createElement('div');
            snowflake.classList.add('snowflake');
            snowflake.textContent = '❄';
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
            snowflake.style.animationDelay = Math.random() * 5 + 's';
            snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
            snowContainer.appendChild(snowflake);
        }
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    }
                }

                if (finalTranscript && !this.isProcessing) {
                    this.handleUserSpeech(finalTranscript);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'no-speech') {
                    // Ignore no-speech errors, just continue listening
                    return;
                }
                this.updateStatus('Sorry, I had trouble hearing you. Please try again!');
            };

            this.recognition.onend = () => {
                if (this.isCallActive && !this.isProcessing) {
                    // Restart recognition if call is still active
                    setTimeout(() => {
                        if (this.isCallActive) {
                            this.recognition.start();
                        }
                    }, 100);
                }
            };
        } else {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        }
    }

    initTextToSpeech() {
        // Wait for voices to load
        if (this.synthesis.getVoices().length > 0) {
            this.selectSantaVoice();
        } else {
            this.synthesis.onvoiceschanged = () => {
                this.selectSantaVoice();
            };
        }
    }

    selectSantaVoice() {
        const voices = this.synthesis.getVoices();
        // Try to find a deep, jolly voice for Santa
        // Prefer male voices with "UK" or deep-sounding names
        this.santaVoice = voices.find(voice =>
            voice.name.includes('Daniel') ||
            voice.name.includes('Fred') ||
            voice.name.includes('UK Male') ||
            voice.name.includes('Google UK English Male')
        ) || voices.find(voice => voice.lang.startsWith('en') && voice.name.includes('Male'))
          || voices[0];
    }

    setupEventListeners() {
        this.callButton.addEventListener('click', () => this.startCall());
        this.hangUpButton.addEventListener('click', () => this.endCall());
    }

    async startCall() {
        this.isCallActive = true;
        this.callButton.classList.add('hidden');
        this.hangUpButton.classList.remove('hidden');
        this.messages.innerHTML = '';
        this.conversationHistory = [];

        this.statusIndicator.classList.add('speaking');
        this.updateStatus('Connected to North Pole!');

        // Santa's greeting
        await this.santaSpeak(this.getGreeting());

        // Start listening
        this.startListening();
    }

    endCall() {
        this.isCallActive = false;
        this.stopListening();

        this.callButton.classList.remove('hidden');
        this.hangUpButton.classList.add('hidden');
        this.statusIndicator.classList.remove('listening', 'speaking');

        this.updateStatus('Call ended. Merry Christmas!');
        this.addMessage('santa', 'Ho ho ho! Merry Christmas! Call me anytime! 🎅🎄');
    }

    startListening() {
        if (this.recognition) {
            this.recognition.start();
            this.statusIndicator.classList.remove('speaking');
            this.statusIndicator.classList.add('listening');
            this.updateStatus('Santa is listening...');
        }
    }

    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.synthesis.cancel();
    }

    async handleUserSpeech(transcript) {
        if (!transcript.trim() || this.isProcessing) return;

        this.isProcessing = true;
        this.stopListening();

        // Add user message to conversation
        this.addMessage('user', transcript);
        this.conversationHistory.push({ role: 'user', content: transcript });

        this.statusIndicator.classList.remove('listening');
        this.statusIndicator.classList.add('speaking');
        this.updateStatus('Santa is responding...');

        // Generate Santa's response
        const response = this.generateSantaResponse(transcript);

        // Santa speaks
        await this.santaSpeak(response);

        // Resume listening if call is still active
        if (this.isCallActive) {
            this.startListening();
        }

        this.isProcessing = false;
    }

    generateSantaResponse(userText) {
        const lowerText = userText.toLowerCase();

        // Extract mentioned items
        const gifts = this.extractGifts(lowerText);
        const conversationCount = this.conversationHistory.filter(h => h.role === 'user').length;

        // First interaction - acknowledge what they want
        if (conversationCount === 1) {
            if (gifts.length > 0) {
                const responses = [
                    `Ho ho ho! ${this.getExclamation()} You want ${this.formatGiftList(gifts)}! What a wonderful choice! ${this.getEncouragement()}`,
                    `Well well well! ${this.formatGiftList(gifts)}! ${this.getExclamation()} That sounds absolutely magical! ${this.getEncouragement()}`,
                    `Oh my goodness! ${this.formatGiftList(gifts)}! ${this.getExclamation()} I'll make a note of that right away! ${this.getEncouragement()}`,
                    `Ho ho ho! ${this.formatGiftList(gifts)}! ${this.getExclamation()} What an exciting wish! ${this.getEncouragement()}`
                ];
                const response = this.randomChoice(responses);
                this.conversationHistory.push({ role: 'santa', content: response });
                return response;
            } else {
                const responses = [
                    `Ho ho ho! That's wonderful! ${this.getExclamation()} Tell me more about what you'd like for Christmas!`,
                    `Oh my! ${this.getExclamation()} I'm so excited to hear what you want! Can you tell me more?`,
                    `Well hello there! ${this.getExclamation()} What special gifts are on your wish list this year?`
                ];
                const response = this.randomChoice(responses);
                this.conversationHistory.push({ role: 'santa', content: response });
                return response;
            }
        }

        // Follow-up interactions
        if (gifts.length > 0) {
            const responses = [
                `Oh! ${this.formatGiftList(gifts)} too! ${this.getExclamation()} You have such wonderful taste! ${this.getEncouragement()}`,
                `And ${this.formatGiftList(gifts)}! ${this.getExclamation()} I love it! ${this.getEncouragement()}`,
                `${this.formatGiftList(gifts)}! ${this.getExclamation()} Adding that to my list right now! ${this.getEncouragement()}`
            ];
            const response = this.randomChoice(responses);
            this.conversationHistory.push({ role: 'santa', content: response });
            return response;
        }

        // Check for questions or other intents
        if (lowerText.includes('thank') || lowerText.includes('thanks')) {
            const responses = [
                `You're so welcome! Ho ho ho! ${this.getExclamation()} Keep being good! ${this.getEncouragement()}`,
                `My pleasure, dear child! ${this.getExclamation()} Have a magical Christmas! ${this.getEncouragement()}`
            ];
            const response = this.randomChoice(responses);
            this.conversationHistory.push({ role: 'santa', content: response });
            return response;
        }

        if (lowerText.includes('good') && (lowerText.includes('been') || lowerText.includes('am'))) {
            const responses = [
                `I know you have! ${this.getExclamation()} I've been watching and you're on the nice list! ${this.getEncouragement()}`,
                `Oh yes! My elves told me all about you! ${this.getExclamation()} You've been very good! ${this.getEncouragement()}`
            ];
            const response = this.randomChoice(responses);
            this.conversationHistory.push({ role: 'santa', content: response });
            return response;
        }

        // Generic enthusiastic responses
        const responses = [
            `Ho ho ho! ${this.getExclamation()} That's wonderful! ${this.getEncouragement()} Is there anything else you'd like?`,
            `${this.getExclamation()} I'm so happy to hear from you! ${this.getEncouragement()} Tell me more!`,
            `Oh my! ${this.getExclamation()} You're such a good child! ${this.getEncouragement()} What else is on your mind?`
        ];
        const response = this.randomChoice(responses);
        this.conversationHistory.push({ role: 'santa', content: response });
        return response;
    }

    extractGifts(text) {
        const gifts = [];

        // Common toys and gifts
        const giftPatterns = [
            { pattern: /(?:a |an |some )?bike(?:s)?/i, name: 'a bike' },
            { pattern: /(?:a |an |some )?doll(?:s)?/i, name: 'a doll' },
            { pattern: /(?:a |an |some )?car(?:s)?|toy car(?:s)?/i, name: 'a car' },
            { pattern: /(?:a |an |some )?truck(?:s)?/i, name: 'a truck' },
            { pattern: /(?:a |an |some )?train(?:s)?/i, name: 'a train' },
            { pattern: /(?:a |an |some )?lego(?:s)?|building block(?:s)?/i, name: 'legos' },
            { pattern: /(?:a |an |some )?puzzle(?:s)?/i, name: 'a puzzle' },
            { pattern: /(?:a |an |some )?book(?:s)?/i, name: 'a book' },
            { pattern: /(?:a |an |some )?game(?:s)?|video game(?:s)?/i, name: 'a game' },
            { pattern: /(?:a |an |some )?ball(?:s)?|soccer ball|basketball|football/i, name: 'a ball' },
            { pattern: /(?:a |an |some )?scooter(?:s)?/i, name: 'a scooter' },
            { pattern: /(?:a |an |some )?skateboard(?:s)?/i, name: 'a skateboard' },
            { pattern: /(?:a |an |some )?teddy bear(?:s)?|stuffed animal(?:s)?/i, name: 'a teddy bear' },
            { pattern: /(?:a |an |some )?action figure(?:s)?/i, name: 'an action figure' },
            { pattern: /(?:a |an |some )?robot(?:s)?/i, name: 'a robot' },
            { pattern: /(?:a |an |some )?drone(?:s)?/i, name: 'a drone' },
            { pattern: /(?:a |an |some )?tablet(?:s)?|ipad/i, name: 'a tablet' },
            { pattern: /(?:a |an |some )?phone(?:s)?|iphone/i, name: 'a phone' },
            { pattern: /(?:a |an |some )?computer(?:s)?|laptop(?:s)?/i, name: 'a computer' },
            { pattern: /(?:a |an |some )?playstation|ps5|xbox|nintendo|switch/i, name: 'a game console' },
            { pattern: /(?:a |an |some )?puppy|puppies|dog(?:s)?/i, name: 'a puppy' },
            { pattern: /(?:a |an |some )?kitten(?:s)?|cat(?:s)?/i, name: 'a kitten' },
            { pattern: /(?:a |an |some )?pet(?:s)?/i, name: 'a pet' },
        ];

        for (const { pattern, name } of giftPatterns) {
            if (pattern.test(text)) {
                gifts.push(name);
            }
        }

        // If no specific gifts found, try to extract nouns that might be gifts
        if (gifts.length === 0) {
            const wantWords = ['want', 'would like', 'wish for', 'hoping for', 'asking for', 'like'];
            for (const wantWord of wantWords) {
                if (text.includes(wantWord)) {
                    const afterWant = text.split(wantWord)[1];
                    if (afterWant) {
                        const words = afterWant.trim().split(/\s+/).slice(0, 5);
                        if (words.length > 0) {
                            const potential = words.join(' ').replace(/[,!?.]/g, '').trim();
                            if (potential) {
                                gifts.push(potential);
                            }
                        }
                    }
                }
            }
        }

        return gifts;
    }

    formatGiftList(gifts) {
        if (gifts.length === 0) return '';
        if (gifts.length === 1) return gifts[0];
        if (gifts.length === 2) return `${gifts[0]} and ${gifts[1]}`;
        const lastGift = gifts[gifts.length - 1];
        const otherGifts = gifts.slice(0, -1).join(', ');
        return `${otherGifts}, and ${lastGift}`;
    }

    getGreeting() {
        const greetings = [
            "Ho ho ho! Merry Christmas! This is Santa Claus! I'm so happy to hear from you! What would you like for Christmas this year?",
            "Well hello there! Ho ho ho! Santa Claus here! I've been waiting to hear from you! Tell me, what's on your wish list this year?",
            "Ho ho ho! Merry Christmas! Santa speaking! It's so wonderful to hear your voice! What magical gifts are you dreaming of?",
            "Jingle bells, jingle bells! Ho ho ho! Santa here! I'm so excited to talk with you! What would make your Christmas extra special?"
        ];
        return this.randomChoice(greetings);
    }

    getExclamation() {
        const exclamations = [
            'How wonderful!',
            'How delightful!',
            'Magnificent!',
            'Marvelous!',
            'Splendid!',
            'How exciting!',
            'Fantastic!',
            'Absolutely wonderful!'
        ];
        return this.randomChoice(exclamations);
    }

    getEncouragement() {
        const encouragements = [
            "Keep being good!",
            "You're such a good child!",
            "I'm so proud of you!",
            "You've been so good this year!",
            "The elves are excited about this!",
            "Mrs. Claus will love hearing about this!",
            "My reindeer are getting ready for the big night!",
            "Christmas magic is in the air!"
        ];
        return this.randomChoice(encouragements);
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    santaSpeak(text) {
        return new Promise((resolve) => {
            this.addMessage('santa', text);

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.santaVoice;
            utterance.rate = 0.9; // Slightly slower for Santa's jolly voice
            utterance.pitch = 0.8; // Lower pitch for a deeper voice
            utterance.volume = 1.0;

            utterance.onend = () => {
                resolve();
            };

            utterance.onerror = () => {
                console.error('Speech synthesis error');
                resolve();
            };

            this.synthesis.speak(utterance);
        });
    }

    addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        const label = document.createElement('div');
        label.classList.add('message-label');
        label.textContent = sender === 'user' ? 'You' : '🎅 Santa';

        const content = document.createElement('div');
        content.textContent = text;

        messageDiv.appendChild(label);
        messageDiv.appendChild(content);

        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    showMessage(type, text) {
        // You can expand this for different message types
        console.log(`[${type}] ${text}`);
    }

    updateStatus(text) {
        this.callStatus.querySelector('p').textContent = text;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SantaCallingApp();
});
