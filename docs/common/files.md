# Files

- [fileExists](#fileexists)
- [folderExists](#folderexists)
- [decodeBase64](#decodebase64)
- [writeToFile](#writetofile)
- [findFirstFile](#findfirstfile)

<br><hr>

## fileExists

Boolean true if specified path exists as a file


## folderExists

Boolean true if specified path exists as a folder


## decodeBase64

Converts encoded base64 string to standard


## writeToFile

Write non-streaming content to file
- path must exist
- file will be created if does not exist


## findFirstFile

Searches from specified path upwards for a specified file returns the resolved path if found. Takes an optional starting path which defaults to `__dirName`. Returns `null` on any error.
