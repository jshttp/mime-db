# MIME sources

This directory contains various sources for building the database.

## Type data files

Type data files are those that are in the format `*-types.json` and contain
general MIME type data.

### Format

The JSON consists of a single object with keys being the normalized MIME type
(all lower-case) and the value being an object of the data with the following
keys:

#### compressible

A Boolean indicating if the type is "compressible". The definition of
"compressible" is loose, but in general indicates if a compression algorithm
like gzip is able to reduce the size of a typical file in the matching format.

#### extensions

An array of extensions assigned to the MIME type. The order of extensions is
significant, with the most-preferred at index 0.

#### notes

A free-form string that contains miscellaneous notes regarding the type.

#### sources

An array of URLs that are used to source the type.

### apache-types.json

Data built from the Apache project.

### custom-types.json

Data that is custom from the community or `mime-db` maintainers.

### iana-types.json

Data built from the IANA database.

### nginx-types.json

Data built from the nginx database.

## custom-suffix.json

Data that is custom from the community or `mime-db` maintainers that applies
to all types with a given suffix.
