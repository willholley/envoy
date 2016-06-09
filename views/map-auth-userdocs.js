function (doc) {
  if (doc['com_cloudant_meta'] && doc['com_cloudant_meta'].ownerid) {
    emit(doc['com_cloudant_meta'].ownerid, 1);
  }
}
