import { LightningElement, track } from 'lwc';
import aiChat from '@salesforce/apex/CineLog_Controller.aiChat';

export default class CineLogAIChat extends LightningElement {

    @track messages  = [];
    @track inputText = '';
    @track isTyping  = false;

    msgCounter = 0;

    // ── Input handlers ────────────────────────────────────────────
    handleInput(event) { this.inputText = event.target.value; }

    handleKeyUp(event) {
        if (event.key === 'Enter' && !this.isTyping) this.handleSend();
    }

    handleSuggestionClick(event) {
        this.inputText = event.currentTarget.dataset.msg;
        this.handleSend();
    }

    // ── Send message ──────────────────────────────────────────────
    handleSend() {
        const text = this.inputText.trim();
        if (!text || this.isTyping) return;

        // Add user message
        this.addMessage(text, 'user');
        this.inputText = '';
        this.isTyping  = true;

        // Call Gemini
        aiChat({ userMessage: text })
            .then(response => {
                this.isTyping = false;
                this.addMessage(response, 'ai');
                this.scrollToBottom();
            })
            .catch(() => {
                this.isTyping = false;
                this.addMessage('Sorry, something went wrong. Please try again.', 'ai');
            });

        this.scrollToBottom();
    }

    // ── Add message to list ───────────────────────────────────────
    addMessage(text, sender) {
        const now  = new Date();
        const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
        this.messages = [
            ...this.messages,
            {
                id      : ++this.msgCounter,
                text    : text,
                time    : time,
                wrapClass: sender === 'user' ? 'message user-message' : 'message ai-message'
            }
        ];
    }

    // ── Scroll to bottom ──────────────────────────────────────────
    scrollToBottom() {
        setTimeout(() => {
            const container = this.template.querySelector('.chat-messages');
            if (container) container.scrollTop = container.scrollHeight;
        }, 100);
    }

    // ── Close ─────────────────────────────────────────────────────
    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleOverlayClick() { this.handleClose(); }
    stopProp(event)       { event.stopPropagation(); }
}