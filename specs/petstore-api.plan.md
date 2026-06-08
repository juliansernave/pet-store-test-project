# Swagger Petstore API Test Plan

## Application Overview

API-level test plan for the Swagger Petstore demo REST API (base URL https://petstore.swagger.io/v2, schema https://petstore.swagger.io/v2/swagger.json). The plan targets the HTTP API only - it does not exercise the Swagger UI. It is split into three independent top-level suites (Pet, Store, User) so each suite can be executed as a separate phase. Each suite covers happy-path verification of every endpoint, negative/edge cases (invalid IDs, missing required fields, wrong content types, non-existent resources), contract checks (status codes, response schema, lifecycle round-trips), and where relevant authentication/session behavior. Tests assume a fresh state and generate unique IDs/usernames per run to remain order-independent.

## Test Scenarios

### 1. Pet

**Seed:** `tests/seed.spec.ts`

#### 1.1. POST /pet creates a pet and returns it with assigned id

**File:** `tests/pet/post-pet-create.spec.ts`

**Steps:**
  1. Send POST https://petstore.swagger.io/v2/pet with a valid Pet body containing a unique id, name, category {id,name}, photoUrls array, tags array, and status='available'
    - expect: Response status is 200
    - expect: Response Content-Type is application/json
    - expect: Response body matches the Pet schema (id, name, photoUrls, status all present)
    - expect: Returned id equals the id sent in the request
    - expect: Returned name and status match the request body

#### 1.2. POST /pet with missing required fields returns 4xx or invalid response

**File:** `tests/pet/post-pet-invalid-body.spec.ts`

**Steps:**
  1. Send POST /pet with an empty JSON body {}
    - expect: Response status is 4xx (400/405) OR the server rejects the payload without persisting it
  2. Send POST /pet with malformed JSON (e.g. truncated braces)
    - expect: Response status is 400 or 415
    - expect: Response body indicates a parse/validation error
  3. Send POST /pet with Content-Type text/plain
    - expect: Response status is 415 or 400, request is rejected

#### 1.3. POST /pet with wrong type for status is rejected or sanitized

**File:** `tests/pet/post-pet-wrong-types.spec.ts`

**Steps:**
  1. Send POST /pet with status set to a numeric value (e.g. 123) instead of a string
    - expect: Response status is 400/500 OR the server coerces value and response does not contain the invalid type unchanged
  2. Send POST /pet with id as a string ('abc')
    - expect: Response status is 400/500, pet is not created with that id

#### 1.4. GET /pet/{petId} returns a previously created pet

**File:** `tests/pet/get-pet-by-id.spec.ts`

**Steps:**
  1. POST /pet to create a pet with a unique id and capture the id
    - expect: Pet is created with 200 status
  2. Send GET /pet/{petId} using the captured id
    - expect: Response status is 200
    - expect: Response body id equals the requested id
    - expect: Response body matches the Pet schema (name, photoUrls, status)

#### 1.5. GET /pet/{petId} returns 404 for non-existent id

**File:** `tests/pet/get-pet-not-found.spec.ts`

**Steps:**
  1. Send GET /pet/{petId} with a very large random id unlikely to exist (e.g. 9999999999999)
    - expect: Response status is 404
    - expect: Response body contains an error message structure with code/type/message

#### 1.6. GET /pet/{petId} returns 400 for invalid id format

**File:** `tests/pet/get-pet-invalid-id.spec.ts`

**Steps:**
  1. Send GET /pet/not-a-number
    - expect: Response status is 404 or 400 (per Swagger doc, invalid ID supplied -> 400)

#### 1.7. PUT /pet updates an existing pet

**File:** `tests/pet/put-pet-update.spec.ts`

**Steps:**
  1. Create a pet via POST /pet and capture its id
    - expect: Creation succeeds with 200
  2. Send PUT /pet with the same id and modified name and status='sold'
    - expect: Response status is 200
    - expect: Response body reflects the new name and status='sold'
  3. GET /pet/{petId} for the same id
    - expect: Returned name and status match the updated values

#### 1.8. PUT /pet with non-existent id behavior

**File:** `tests/pet/put-pet-not-found.spec.ts`

**Steps:**
  1. Send PUT /pet with an id that has never been created
    - expect: Response status is 200 (server may upsert) or 404 - assert one of the documented responses (400/404/405) and that no contradictory data is returned

#### 1.9. PUT /pet with invalid body returns 400/405

**File:** `tests/pet/put-pet-invalid.spec.ts`

**Steps:**
  1. Send PUT /pet with body missing required fields (no name, no photoUrls)
    - expect: Response status is 400 or 405 per Swagger doc

#### 1.10. GET /pet/findByStatus returns pets filtered by available status

**File:** `tests/pet/get-find-by-status-available.spec.ts`

**Steps:**
  1. Create a pet with status='available' and capture id
    - expect: Creation succeeds
  2. Send GET /pet/findByStatus?status=available
    - expect: Response status is 200
    - expect: Response body is a JSON array
    - expect: Every element has status='available'
    - expect: The created pet id appears in the array

#### 1.11. GET /pet/findByStatus supports multiple status values

**File:** `tests/pet/get-find-by-status-multi.spec.ts`

**Steps:**
  1. Send GET /pet/findByStatus?status=available&status=pending&status=sold
    - expect: Response status is 200
    - expect: Each element's status is one of available/pending/sold

#### 1.12. GET /pet/findByStatus returns 400 for invalid status value

**File:** `tests/pet/get-find-by-status-invalid.spec.ts`

**Steps:**
  1. Send GET /pet/findByStatus?status=notARealStatus
    - expect: Response status is 400 per Swagger doc OR response is 200 with empty array - assert documented behavior
  2. Send GET /pet/findByStatus with no status query param
    - expect: Response status is 400

#### 1.13. GET /pet/findByTags returns pets by tag

**File:** `tests/pet/get-find-by-tags.spec.ts`

**Steps:**
  1. Create a pet with a unique tag (e.g. 'qa-tag-<random>')
    - expect: Creation succeeds
  2. Send GET /pet/findByTags?tags=qa-tag-<random>
    - expect: Response status is 200
    - expect: Response body is an array
    - expect: Created pet appears in array and contains the requested tag

#### 1.14. GET /pet/findByTags returns 400 when tags param is missing

**File:** `tests/pet/get-find-by-tags-missing.spec.ts`

**Steps:**
  1. Send GET /pet/findByTags with no tags query parameter
    - expect: Response status is 400 or 200 with empty array (assert documented contract)

#### 1.15. POST /pet/{petId} updates pet via form data

**File:** `tests/pet/post-pet-form-update.spec.ts`

**Steps:**
  1. Create a pet via POST /pet and capture id
    - expect: Creation succeeds
  2. Send POST /pet/{petId} with Content-Type application/x-www-form-urlencoded body name=UpdatedName&status=pending
    - expect: Response status is 200
    - expect: Response body code/type/message structure indicates success
  3. GET /pet/{petId} and verify name='UpdatedName' and status='pending'
    - expect: Updated values are persisted

#### 1.16. POST /pet/{petId} form update returns 405 for invalid input

**File:** `tests/pet/post-pet-form-invalid.spec.ts`

**Steps:**
  1. Send POST /pet/{petId} for a non-existent petId with form fields
    - expect: Response status is 404 or 405 per Swagger doc

#### 1.17. POST /pet/{petId}/uploadImage uploads an image and returns ApiResponse

**File:** `tests/pet/post-upload-image.spec.ts`

**Steps:**
  1. Create a pet via POST /pet and capture id
    - expect: Creation succeeds
  2. Send POST /pet/{petId}/uploadImage with multipart/form-data containing additionalMetadata='qa-upload' and a small image file in the file field
    - expect: Response status is 200
    - expect: Response body matches ApiResponse schema (code, type, message)
    - expect: Response message references the uploaded file name

#### 1.18. POST /pet/{petId}/uploadImage with non-existent petId

**File:** `tests/pet/post-upload-image-not-found.spec.ts`

**Steps:**
  1. Send POST /pet/999999999/uploadImage with a small image file
    - expect: Response status is 200 with ApiResponse OR 404 - assert documented contract and that no successful upload references a real pet

#### 1.19. DELETE /pet/{petId} removes a pet

**File:** `tests/pet/delete-pet.spec.ts`

**Steps:**
  1. Create a pet via POST /pet and capture id
    - expect: Creation succeeds
  2. Send DELETE /pet/{petId} with header api_key='special-key'
    - expect: Response status is 200
  3. Send GET /pet/{petId} for the same id
    - expect: Response status is 404

#### 1.20. DELETE /pet/{petId} returns 404 for non-existent pet

**File:** `tests/pet/delete-pet-not-found.spec.ts`

**Steps:**
  1. Send DELETE /pet/9999999999999 with api_key='special-key'
    - expect: Response status is 404

#### 1.21. DELETE /pet/{petId} returns 400 for invalid id format

**File:** `tests/pet/delete-pet-invalid.spec.ts`

**Steps:**
  1. Send DELETE /pet/not-an-int with api_key='special-key'
    - expect: Response status is 400 or 404 per Swagger doc

#### 1.22. Pet full lifecycle: create -> read -> update -> delete -> verify gone

**File:** `tests/pet/pet-lifecycle.spec.ts`

**Steps:**
  1. POST /pet to create a pet with unique id
    - expect: 201/200 returned, body matches request
  2. GET /pet/{petId}
    - expect: 200 returned, body matches the created pet
  3. PUT /pet to update name and status
    - expect: 200 returned, body reflects updates
  4. POST /pet/{petId} form update of status='sold'
    - expect: 200 returned
  5. DELETE /pet/{petId}
    - expect: 200 returned
  6. GET /pet/{petId}
    - expect: 404 returned

### 2. Store

**Seed:** `tests/seed.spec.ts`

#### 2.1. GET /store/inventory returns status->count map

**File:** `tests/store/get-inventory.spec.ts`

**Steps:**
  1. Send GET /store/inventory with header api_key='special-key'
    - expect: Response status is 200
    - expect: Response Content-Type is application/json
    - expect: Response body is an object (map of status string -> integer count)
    - expect: At minimum keys for 'available', 'pending', or 'sold' are present (or object is non-null)

#### 2.2. GET /store/inventory inventory reflects newly created pet

**File:** `tests/store/get-inventory-after-create.spec.ts`

**Steps:**
  1. GET /store/inventory and capture baseline count for 'available'
    - expect: 200 returned
  2. POST /pet to create a pet with status='available'
    - expect: Creation succeeds
  3. GET /store/inventory again
    - expect: 200 returned
    - expect: The 'available' count is >= baseline (inventory is updated or at least not regressed)

#### 2.3. POST /store/order places an order and returns it with id

**File:** `tests/store/post-order-create.spec.ts`

**Steps:**
  1. Send POST /store/order with a valid Order body (id, petId, quantity, shipDate ISO 8601, status='placed', complete=true)
    - expect: Response status is 200
    - expect: Response body matches Order schema (id, petId, quantity, status, complete)
    - expect: Returned id matches requested id
    - expect: Returned status is 'placed'

#### 2.4. POST /store/order returns 400 for invalid order body

**File:** `tests/store/post-order-invalid.spec.ts`

**Steps:**
  1. Send POST /store/order with body containing petId as a string and quantity as boolean
    - expect: Response status is 400 or 500 per Swagger doc
  2. Send POST /store/order with malformed JSON
    - expect: Response status is 400

#### 2.5. GET /store/order/{orderId} returns a previously placed order

**File:** `tests/store/get-order-by-id.spec.ts`

**Steps:**
  1. POST /store/order to create an order with a unique id in valid range (1-10)
    - expect: Order created with 200
  2. Send GET /store/order/{orderId} for the captured id
    - expect: Response status is 200
    - expect: Response body id equals the requested id
    - expect: Response body matches Order schema

#### 2.6. GET /store/order/{orderId} returns 404 for non-existent id

**File:** `tests/store/get-order-not-found.spec.ts`

**Steps:**
  1. Send GET /store/order/99999
    - expect: Response status is 404
    - expect: Response body contains error structure

#### 2.7. GET /store/order/{orderId} returns 400 for out-of-range id

**File:** `tests/store/get-order-invalid-id.spec.ts`

**Steps:**
  1. Send GET /store/order/0 (per swagger valid ids are 1..10)
    - expect: Response status is 400 or 404 per Swagger doc
  2. Send GET /store/order/-1
    - expect: Response status is 400 or 404
  3. Send GET /store/order/abc
    - expect: Response status is 400 or 404

#### 2.8. DELETE /store/order/{orderId} removes an order

**File:** `tests/store/delete-order.spec.ts`

**Steps:**
  1. Create an order via POST /store/order and capture id
    - expect: Order created
  2. Send DELETE /store/order/{orderId}
    - expect: Response status is 200
  3. Send GET /store/order/{orderId}
    - expect: Response status is 404

#### 2.9. DELETE /store/order/{orderId} returns 404 for non-existent id

**File:** `tests/store/delete-order-not-found.spec.ts`

**Steps:**
  1. Send DELETE /store/order/99999
    - expect: Response status is 404

#### 2.10. Store order lifecycle: place -> get -> delete -> verify gone

**File:** `tests/store/order-lifecycle.spec.ts`

**Steps:**
  1. POST /store/order with valid body and capture id
    - expect: 200 returned
  2. GET /store/order/{id}
    - expect: 200 returned, body matches created order
  3. DELETE /store/order/{id}
    - expect: 200 returned
  4. GET /store/order/{id}
    - expect: 404 returned

### 3. User

**Seed:** `tests/seed.spec.ts`

#### 3.1. POST /user creates a single user

**File:** `tests/user/post-user-create.spec.ts`

**Steps:**
  1. Send POST /user with a valid User body (id, username='qa-<random>', firstName, lastName, email, password, phone, userStatus)
    - expect: Response status is 200
    - expect: Response body matches ApiResponse schema (code, type, message)
    - expect: message contains the created user id or username

#### 3.2. POST /user with invalid JSON returns error

**File:** `tests/user/post-user-invalid.spec.ts`

**Steps:**
  1. Send POST /user with malformed JSON body
    - expect: Response status is 400 or 500
  2. Send POST /user with wrong Content-Type text/plain and a JSON-looking body
    - expect: Response status is 415 or 400

#### 3.3. POST /user/createWithArray creates multiple users

**File:** `tests/user/post-create-with-array.spec.ts`

**Steps:**
  1. Send POST /user/createWithArray with an array body containing 3 unique users
    - expect: Response status is 200
    - expect: Response body matches ApiResponse schema
  2. GET /user/{username} for each created username
    - expect: Each user is retrievable with 200 and correct fields

#### 3.4. POST /user/createWithList creates multiple users

**File:** `tests/user/post-create-with-list.spec.ts`

**Steps:**
  1. Send POST /user/createWithList with an array body containing 2 unique users
    - expect: Response status is 200
    - expect: Response body matches ApiResponse schema
  2. GET /user/{username} for each created username
    - expect: Each user is retrievable with 200

#### 3.5. POST /user/createWithArray returns error for non-array body

**File:** `tests/user/post-create-with-array-invalid.spec.ts`

**Steps:**
  1. Send POST /user/createWithArray with a single user object (not an array)
    - expect: Response status is 400 or 500

#### 3.6. GET /user/{username} returns a previously created user

**File:** `tests/user/get-user.spec.ts`

**Steps:**
  1. Create a user via POST /user with username='qa-<random>'
    - expect: Creation succeeds with 200
  2. Send GET /user/qa-<random>
    - expect: Response status is 200
    - expect: Response body matches User schema (id, username, firstName, lastName, email, password, phone, userStatus)
    - expect: username equals the requested value

#### 3.7. GET /user/{username} returns 404 for non-existent username

**File:** `tests/user/get-user-not-found.spec.ts`

**Steps:**
  1. Send GET /user/this-user-does-not-exist-<random>
    - expect: Response status is 404
    - expect: Response body contains error structure

#### 3.8. PUT /user/{username} updates an existing user

**File:** `tests/user/put-user-update.spec.ts`

**Steps:**
  1. Create a user via POST /user and capture username
    - expect: Creation succeeds
  2. Send PUT /user/{username} with body containing modified email and firstName
    - expect: Response status is 200
    - expect: Response body matches ApiResponse
  3. GET /user/{username} and verify the updated email and firstName are persisted
    - expect: Response status is 200 and fields reflect the update

#### 3.9. PUT /user/{username} returns error for non-existent username

**File:** `tests/user/put-user-not-found.spec.ts`

**Steps:**
  1. Send PUT /user/no-such-user-<random> with a valid User body
    - expect: Response status is 404 or 200 per Swagger doc (server may upsert) - assert documented behavior

#### 3.10. DELETE /user/{username} removes a user

**File:** `tests/user/delete-user.spec.ts`

**Steps:**
  1. Create a user via POST /user and capture username
    - expect: Creation succeeds
  2. Send DELETE /user/{username}
    - expect: Response status is 200
  3. Send GET /user/{username}
    - expect: Response status is 404

#### 3.11. DELETE /user/{username} returns 404 for non-existent user

**File:** `tests/user/delete-user-not-found.spec.ts`

**Steps:**
  1. Send DELETE /user/no-such-user-<random>
    - expect: Response status is 404

#### 3.12. GET /user/login with valid credentials succeeds and returns session info

**File:** `tests/user/login.spec.ts`

**Steps:**
  1. Create a user with username='qa-<random>' and password='Passw0rd!'
    - expect: Creation succeeds
  2. Send GET /user/login?username=qa-<random>&password=Passw0rd!
    - expect: Response status is 200
    - expect: Response body is a plain string or ApiResponse referencing a session/token
    - expect: Response headers may include X-Expires-After (RFC1123 date) and X-Rate-Limit (integer)

#### 3.13. GET /user/login with invalid credentials returns 400

**File:** `tests/user/login-invalid.spec.ts`

**Steps:**
  1. Send GET /user/login?username=&password=
    - expect: Response status is 400
  2. Send GET /user/login without query parameters
    - expect: Response status is 400

#### 3.14. GET /user/logout always returns 200

**File:** `tests/user/logout.spec.ts`

**Steps:**
  1. Send GET /user/login with valid credentials to establish a session
    - expect: 200 returned
  2. Send GET /user/logout
    - expect: Response status is 200 (default response per Swagger)
  3. Send GET /user/logout again without an active session
    - expect: Response status is 200 (idempotent)

#### 3.15. User lifecycle: create -> login -> get -> update -> logout -> delete -> verify gone

**File:** `tests/user/user-lifecycle.spec.ts`

**Steps:**
  1. POST /user to create a user with unique username
    - expect: 200 returned with ApiResponse
  2. GET /user/login with the created credentials
    - expect: 200 returned
  3. GET /user/{username}
    - expect: 200 returned, body matches the created user
  4. PUT /user/{username} with modified email
    - expect: 200 returned
  5. GET /user/{username} to verify update
    - expect: Updated email is persisted
  6. GET /user/logout
    - expect: 200 returned
  7. DELETE /user/{username}
    - expect: 200 returned
  8. GET /user/{username}
    - expect: 404 returned

#### 3.16. Pet DELETE requires api_key header (auth-relevant negative case)

**File:** `tests/user/pet-delete-without-api-key.spec.ts`

**Steps:**
  1. Create a pet via POST /pet and capture id
    - expect: Creation succeeds
  2. Send DELETE /pet/{petId} WITHOUT the api_key header
    - expect: Response status is 401/403 if auth enforced, OR 200 if demo server does not enforce - assert documented contract for the demo and that the response is consistent across runs
