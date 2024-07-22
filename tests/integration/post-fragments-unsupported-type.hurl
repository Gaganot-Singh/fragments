# tests/integration/post-fragments-unsupported-type.hurl
# Authenticated POST to /v1/fragments with unsupported Content-Type
POST http://localhost:8080/v1/fragments
# We're sending an unsupported content type fragment
Content-Type: application/xml
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# Body of the request goes in ```...``` when it's a string
`<fragment>This is a fragment!</fragment>`
 
# We expect to get back an HTTP 415
HTTP/1.1 415
# We have various assertions about the response that we want to check
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415
jsonpath "$.error.message" == "The Content-Type of the fragment being sent with the request is not supported"
