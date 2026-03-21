import { LightningElement, api, track } from 'lwc';

export default class CineLogCard extends LightningElement {

    // Parent passes the full Movie__c record in
    @api movie;

    // Local editable state — pre-filled from the movie record
    @track status    = '';
    @track myRating  = null;
    @track myReview  = '';
    @track watchDate = '';

    connectedCallback() {
        this.status    = this.movie.Status__c     || 'Want to Watch';
        this.myRating  = this.movie.My_Rating__c  || null;
        this.myReview  = this.movie.My_Review__c  || '';
        this.watchDate = this.movie.Watch_Date__c || '';
    }

    // ── Status picklist options ───────────────────────────────────
    get statusOptions() {
        return [
            { label: 'Want to Watch', value: 'Want to Watch' },
            { label: 'Watching',      value: 'Watching'      },
            { label: 'Watched',       value: 'Watched'       },
            { label: 'Dropped',       value: 'Dropped'       }
        ];
    }

    // ── Input handlers ────────────────────────────────────────────
    handleStatusChange(event)    { this.status    = event.detail.value; }
    handleRatingChange(event)    { this.myRating  = event.detail.value; }
    handleReviewChange(event)    { this.myReview  = event.detail.value; }
    handleWatchDateChange(event) { this.watchDate = event.detail.value; }

    // ── Fire save event up to parent ──────────────────────────────
    handleSave() {
        this.dispatchEvent(new CustomEvent('save', {
            detail: {
                movieId  : this.movie.Id,
                status   : this.status,
                myRating : this.myRating,
                myReview : this.myReview,
                watchDate: this.watchDate
            }
        }));
    }

    // ── Fire AI summary event up to parent ────────────────────────
    handleAISummary() {
        this.dispatchEvent(new CustomEvent('aisummary', {
            detail: { movieId: this.movie.Id }
        }));
    }

    // ── Fire delete event up to parent ────────────────────────────
    handleDelete() {
        this.dispatchEvent(new CustomEvent('delete', {
            detail: { movieId: this.movie.Id }
        }));
    }
    // Add this method
handleCardClick() {
    this.dispatchEvent(new CustomEvent('cardclick', {
        detail: { movieId: this.movie.Id }
    }));
}
}