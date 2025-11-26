"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listings = void 0;
exports.addListing = addListing;
exports.getListing = getListing;
exports.updateListingStatus = updateListingStatus;
// In-memory store (will be replaced with MongoDB later)
exports.listings = new Map();
function addListing(data) {
    exports.listings.set(data.listingAddress, data);
}
function getListing(listingAddress) {
    return exports.listings.get(listingAddress);
}
function updateListingStatus(listingAddress, status) {
    const listing = exports.listings.get(listingAddress);
    if (listing) {
        listing.status = status;
    }
}
//# sourceMappingURL=listings.js.map