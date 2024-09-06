Fiber Optic Seismology
======================

[Web application](https://earthquake.usgs.gov/esc/fiber/) that displays Distributed Acoustic Sensing Data.

## Installation

First install [Node.js](https://nodejs.org/) and [Grunt](https://gruntjs.com).

1. Clone the repository

```
git clone https://github.com/shaefner-usgs/esc-fiber.git
```

2. Install dependencies

```
cd esc-fiber
npm install

# If you need to add a CA certificate file:
npm config set cafile "<path to your certificate file>"

# Check the 'cafile'
npm config get cafile
```

3. Configure the app

```
cd esc-fiber/src/lib

# Run the configuration script and accept the defaults
./pre-install
```

4. Run grunt

```
cd esc-fiber
grunt
```
