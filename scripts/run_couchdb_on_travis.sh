#!/usr/bin/env bash

if [ ! -z $TRAVIS ]; then
	# Install CouchDB Master
	docker run --ulimit nofile=2048:2048 -d -p 3001:5984 klaemo/couchdb:2.0-dev --with-haproxy \
	    --with-admin-party-please -n 1
	COUCH_PORT=3001

	# wait for couchdb to start
	while [ '200' != $(curl -s -o /dev/null -w %{http_code} http://127.0.0.1:${COUCH_PORT}) ]; do
	  echo waiting for couch to load... ;
	  sleep 1;
	done
fi