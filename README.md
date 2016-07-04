# Cloudant Envoy

_by: Stefan Kruger_

[![Build Status](https://travis-ci.org/cloudant-labs/envoy.svg)](https://travis-ci.org/cloudant-labs/envoy.svg)

## Unsupported software

Note: this is a proof of concept; it's not battle tested or supported in any way. If you find bugs (of which there will be plenty), do let us know – or better, consider a pull request.

## Installation


### Deploy to Bluemix

he fastest way to deploy *Cloudant Envoy* to Bluemix is to click the **Deploy to Bluemix** button below.

[![Deploy to Bluemix](https://deployment-tracker.mybluemix.net/stats/34c200255dfd02ea539780bb433da951/button.svg)](https://bluemix.net/deploy?repository=https://github.com/cloudant-labs/envoy)

**Don't have a Bluemix account?** If you haven't already, you'll be prompted to sign up for a Bluemix account when you click the button.  Sign up, verify your email address, then return here and click the the **Deploy to Bluemix** button again. Your new credentials let you deploy to the platform and also to code online with Bluemix and Git. If you have questions about working in Bluemix, find answers in the [Bluemix Docs](https://www.ng.bluemix.net/docs/).

**Note**: Envoy relies on some cutting edge features from CouchDB2. A Cloudant account attained through Bluemix will by default not be compatible. You will need to request that the account be moved to the Cloudant cluster "Porter" with an email to `support@cloudant.com` stating your account name.

### Manual installation

Cloudant Envoy is a Node.js application on top of the Express.js framework. To install, clone the repo and run `npm install`. The Envoy server needs admin credentials for the backing Cloudant database, and it expects the following environment variables to be set:

```bash
export PORT=8001
export ENVOY_DATABASE_NAME='dbname'
export COUCH_HOST='https://key:passwd@account.cloudant.com'
```

After those variables are set, you can start the Envoy server with `npm start`. Note that the port is the port that Envoy will listen to, not the port of the Cloudant server.

### Environment variables

* PORT - the port number Envoy will listen on. When running in Bluemix, Envoy detects the Cloud Foundry port assigned to this app automatically. When running locally, you'll need to provide your own e.g. `export PORT=8001`
* COUCH_HOST - The URL of the Cloudant service to connected to. Not required in Bluemix, as the attached Cloudant service is detected automatically. `COUCH_HOST` is required when running locally e.g. `export COUCH_HOST='https://key:passwd@account.cloudant.com'`
* ENVOY_DATABASE_NAME - the name of the Cloudant database to use. Defaults to `envoy`
* LOG_FORMAT - the type of logging to output. One of `combined`, `common`, `dev`, `short`, `tiny`, `off`. Defaults to `off`. (see https://www.npmjs.com/package/morgan)
* DEBUG - see debugging section
* ENVOY_AUTH - which authentication plugin to use. One of `default`, `couchdb_users`
* ENVOY_ACCESS - which access control plugin to use. One of `default`, `id`, `meta`
* PRODUCTION - when set to 'true', disables the `POST /_adduser` endpoint

## Debugging

Debugging messages are controlled by the `DEBUG` environment variable. To see detailed debugging outlining the API calls being made between Envoy and Cloudant then set the `DEBUG` environment variable to `cloudant,nano` e.g

```bash
export DEBUG=cloudant,nano
node app.js
```

or

```bash
DEBUG=cloudant,nano node app.js
```

## Introduction

Cloudant has the potential to be an ideal backend for a mobile application. It is scalable, it syncs, and being schema-free it can cope with the frequent data changes that tend to happen in mobile development.

However, Cloudant was never designed to be an _mbaas_ – a complete mobile application backend, and comparisons with dedicated mobile application backends such as Facebook's (now defunct) _Parse_ stack highlight our shortcomings in this area. Some of the problematic areas include:

* _Authorisation_

    Many use cases suitable for a database-backed mobile app require record-level access controls to ensure that each user can only see and update their own data. This problem is compounded by the need for analytics across the whole data set. The currently recommended solution of a database per user and replication of all user databases into a single analytics database is not viable as the number of users grow beyond a certain number.

* _Authentication_

    Every mobile enterprise application will likely need to tap into an existing user database, be it a local LDAP server or a third-party OAuth2 provider, like Facebook or Google.

* _Unreliable networks_

    A mobile app needs to carry on working in the face of unreliable networks. Cloudant's approach is to use its excellent replication capabilities to do bi-directional sync to a local data store on the device, but this is only viable for small data sets as mobile devices by their very nature have limited storage facilities. 
   

There are many different ways to address these issues, client side, server side, or in a middle layer. We propose that a thin middleware gateway application be constructed. The reason for this is that it would allow the mobile-specific functionality could be kept separate from the database itself. The _mbaas_ aspect can be developed independently which means less complexity in the core and the development time and cost can be spread across more people.

## Goals: Cloudant Envoy gateway

*Cloudant Envoy* is a thin gateway server application that sits between a Cloudant database and a mobile application. It implements document-level auth and users. This would provide a way around the first and the third problem areas as described above: each app would be backed by a single database instead of a database per user, and reads and changes would be filtered by user identity.

It is important to understand what this _isn't_. This isn't intended to be a new replicator, or even a way of providing features for other use cases: the intention is to make Cloudant a better fit as a backend in the mobile sphere. By its very nature (e.g. millions of simultaneous users) this layer needs to be as thin as it can be in order to not to become a bottle neck.

The Envoy server should not present an undue load on the underlying Cloudant cluster.

Here's what this currently does:

1. Implement a per-document access rights model
2. Ensure that the replication-specific end points respect the access rights model
3. CORS
4. Extend Cloudant Query (a.k.a. _Mango_) to always implicitly search only the documents a user can see
5. Provide a concept of a local user's database that integrators can hook into
6. Plugin model that allows integrators to tweak or replace both auth and access models


## Per document access rights

The default access plugin implements access rights by modifying the `_id` field of documents to be prefixed by the `sha1` hash
of the username. Hence, if user `hermione` creates the following document:

```json
{
    "_id": "c3065e59c9fa54cc81b5623fa06902f0",
    "_rev": "1-9f7a5dd995bf4953bdb53f22f9b73558",
    "age": 5,
    "type": "owl"
}
```

it would become rewritten to

```json
{
    "_id": "a7257ef242a856304478236fe46fee00f23f8a25-c3065e59c9fa54cc81b5623fa06902f0",
    "_rev": "1-9f7a5dd995bf4953bdb53f22f9b73558",
    "age": 5,
    "type": "owl"
}
```

This states that the user `hermione` can read, update and delete this document. The `_id` field will be modified on create, maintained on updates, but removed before a document is returned in response to a client request. Obviously, this will be visible from the Cloudant console and in responses to client requests which go to the underlying database directly, bypassing the new layer.

We do not expose views in this new layer: client data access will need to be via Query only. This is vital.

If I am user `harry` and I create a new document, the assumption is that I am the sole user with access rights:

```curl
curl 'https://harry:alohomora@hogwarts.com/creatures' \
     -X PUT \
     -H "Content-Type: application/json" \
     -d '{ "age": 456, "type": "thestral" }'
```

will result in the following document being written to the database:

```json
{
    "_id": "23a0b5e4fb6c6e8280940920212ecd563859cb3c-0d711609b3ab27a9069e7da766d93334",
    "_rev": "1-42261671e23759c51e7f0899ee99418d",
    "age": 456,
    "type": "thestral"
}
```

and if I read the document with

```curl
curl 'https://harry:alohomora@hogwarts.com/creatures/0d711609b3ab27a9069e7da766d93334'
```

the result should be

```json
{
    "_id": "0d711609b3ab27a9069e7da766d93334",
    "_rev": "1-42261671e23759c51e7f0899ee99418d",
    "age": 456,
    "type": "thestral"
}
```

If `hermione` now were to request this document she should get a `401 Unauthorized` response.

## Filtered replication 

With this in place we can tackle the other problem: subset or filtered replication. Given that we now have a single database backing the app used by multiple users we need to ensure that mobile sync also obeys the access rules. This means that we need to ensure that the `_changes`, `_bulk_docs`, `_bulk_get` and `_revs_diff` end points also respect the authentication rules.


## CRUD API

We'd need to implement the following parts of the CouchDB CRUD API.

### HEAD|GET _/{db}/{docid}_

If the requesting user isn't the owner the request should fail with a `401 Unauthorized` response.

### POST|DELETE _/{db}/{docid}_

If the requesting user isn't the owner the request should fail with a `401 Unauthorized` response.

### PUT _/{db}/{docid}_

Create a new document, adding the document's ownerid transparently.

## Replication API

### POST _/{db}/\_bulk_docs_

Should behave like the current, adding the document's ownerid transparently, and where documents are provided with `{_id, _rev}` these should be subjected to the authorisation check as for a `POST` to `/{db}/{docid}`.

Note: this is potentially a performance problem as we need to check ownership of every document in the list that is given with `{_id, _rev}`. It may be possible to implement this efficiently by first requesting all docs representing updates using `_all_docs?keys=[key1, key2, ..., keyN]` (or the POST version, rather) and validating the auth details.

### GET _/{db}/\_changes_

The changes feed should be filtered according to the same rules as a `GET` to `/{db}/{docid}`: only return changes related to documents where the requesting user is the owner.

### POST _/{db}/\_revs\_diff_

RevsDiff should check the returned list according to the same rules as a `GET` to `/{db}/{docid}`: only return changes related to documents where the requesting user is the owner.

## Cloudant Query API

### POST _/{db}/\_find

Queries using Cloudant Query only returning the querying user's documents.

## User creation API

### POST _/_adduser

Allows the creation of new Envoy users. Supply a `username` and `password` parameter in a form-encoded post e.g.

```sh
curl -X POST -d 'username=rita&password=password' https://myenvoy.mybluemix.net/_adduser
```

This API is only for evaluation purposes and should be disabled in production, by setting the `PRODUCTION` environment variable.

## Plugins

At startup, *Envoy* can load in plugin modules to modify Envoy's behaviour. The plugin source code can be found in the `lib/plugins` directory, with two plugin types supported

* `auth` - controls how authentication occurs in Envoy.
* `access` - controls how the ownership of a document is stored

### Default auth plugin

The `default` auth plugin uses the "envoyusers" database to store a database of users who are allowed to authenticate. Add a user to your "envoyusers" database witha document like this:

```js
{
  "_id": "glynn",
  "_rev": "1-58bbb25716001c681febaccf6d48a9b8",
  "type": "user",
  "name": "glynn",
  "roles": [],
  "username": "glynn",
  "salt": "monkey",
  "password": "9ef16a44310564ecd1b6894c46d93c58281b07af"
}
```

Where the "password" field is the `sha1` of the "salt" field concatenated with the user's password e.g. 

```js
    > sha1('monkey' + 'password')
    '9ef16a44310564ecd1b6894c46d93c58281b07af'
```

Additional plugins can be selected using the `ENVOY_AUTH` environment variable. e.g. a value of "couchdb_user" will use the
CouchDB "_users" database.

### Default access plugin

The `default` access plugin stores the ownership of a document in the "_id" field of the document. If the owner of the document is "glynn", then
a document who's "_id" is "test" will actually get stored with an id of "3d07659e67fa5a86a06945ec4cdb2754c9fc67bf-test" where "3d07659e67fa5a86a06945ec4cdb2754c9fc67bf" 
is the sha1 hash of the username.

The replication client doesn't see this additional meta data - it is transparently added and stripped out on its way through Envoy - but it allows Envoy to
efficiently store many users data in the same database and retrieve the data each user owns efficiently.

Additional plugins can be selected using the `ENVOY_ACCESS` environment variable.
