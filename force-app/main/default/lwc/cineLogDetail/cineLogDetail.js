import { LightningElement, api, track } from 'lwc';

export default class CineLogDetail extends LightningElement {

    @api movie;
    @api isOpen = false;

    @track status    = '';
    @track myRating  = null;
    @track myReview  = '';
    @track watchDate = '';

    connectedCallback() { this.syncFromMovie(); }

    // Re-sync when movie prop updates
    renderedCallback() { this.syncFromMovie(); }

    syncFromMovie() {
        if (this.movie) {
            this.status    = this.movie.Status__c     || 'Want to Watch';
            this.myRating  = this.movie.My_Rating__c  || null;
            this.myReview  = this.movie.My_Review__c  || '';
            this.watchDate = this.movie.Watch_Date__c || '';
        }
    }

    get isTVShow() { return this.movie && this.movie.Type__c === 'TV Show'; }

    get statusOptions() {
        return [
            { label: 'Want to Watch', value: 'Want to Watch' },
            { label: 'Watching',      value: 'Watching'      },
            { label: 'Watched',       value: 'Watched'       },
            { label: 'Dropped',       value: 'Dropped'       }
        ];
    }

    handleStatusChange(event)    { this.status    = event.detail.value; }
    handleRatingChange(event)    { this.myRating  = event.detail.value; }
    handleReviewChange(event)    { this.myReview  = event.detail.value; }
    handleWatchDateChange(event) { this.watchDate = event.detail.value; }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleOverlayClick() { this.handleClose(); }

    stopPropagation(event) { event.stopPropagation(); }

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

    handleAISummary() {
        this.dispatchEvent(new CustomEvent('aisummary', {
            detail: { movieId: this.movie.Id }
        }));
    }

    handleDelete() {
        this.dispatchEvent(new CustomEvent('delete', {
            detail: { movieId: this.movie.Id }
        }));
    }
}