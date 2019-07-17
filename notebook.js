const notebook = {
    "sheet": {
        "cells": [
            {
                "cellType": "markdown",
                "code": "# Distance travelled and speed between pings\r\n\r\nThis example notebook attempts to determine the speed of a person who is mobile on the city streets. \r\n\r\nIt measures the distance they travel between recorded pings to the server in an attempt to ascertain the speed they are travelling at.",
                "errors": [],
                "id": "7610e5e0-a85b-11e9-b28b-71ec12408101",
                "lastEvaluationDate": "2019-07-17T16:30:57.232+10:00",
                "output": []
            },
            {
                "cellType": "markdown",
                "code": "## Load the data\r\n\r\nFirst we need to record the data loaded from the pings. \r\n\r\nThis data is stored in a JSON file so we use Data-Forge's functions for reading files and parsing JSON data.",
                "errors": [],
                "id": "f5aa74b0-a85b-11e9-b28b-71ec12408101",
                "lastEvaluationDate": "2019-07-17T16:30:57.232+10:00",
                "output": []
            },
            {
                "cellScope": "global",
                "cellType": "code",
                "code": "const { DataFrame, Series } = require('data-forge');\r\nconst { readFileSync } = require('data-forge-fs');\r\nrequire('data-forge-plot');\r\n\r\nconst gpsPings = readFileSync(\"ping-data.json\").parseJSON(); // Load the JSON data file.",
                "errors": [],
                "id": "48e468c1-a758-11e9-8194-df826e3e75d6",
                "lastEvaluationDate": "2019-07-17T16:34:50.592+10:00",
                "output": []
            },
            {
                "cellType": "markdown",
                "code": "## Preview input data\r\n\r\nNow let's preview the source data to make sure it has been loaded correctly.",
                "errors": [],
                "id": "19f6c0d0-a85c-11e9-b28b-71ec12408101",
                "lastEvaluationDate": "2019-07-17T16:30:57.232+10:00",
                "output": []
            },
            {
                "cellScope": "global",
                "cellType": "code",
                "code": "display(gpsPings.head(3));",
                "errors": [],
                "id": "254e0b00-a85c-11e9-b28b-71ec12408101",
                "lastEvaluationDate": "2019-07-17T16:34:50.599+10:00",
                "output": [
                    {
                        "values": [
                            {
                                "data": {
                                    "columnOrder": [
                                        "accuracy",
                                        "altitude",
                                        "latitude",
                                        "longitude",
                                        "timestamp"
                                    ],
                                    "columns": {
                                        "accuracy": "number",
                                        "altitude": "number",
                                        "latitude": "number",
                                        "longitude": "number",
                                        "timestamp": "string"
                                    },
                                    "index": {
                                        "type": "number",
                                        "values": [
                                            0,
                                            1,
                                            2
                                        ]
                                    },
                                    "values": [
                                        {
                                            "__index__": 0,
                                            "accuracy": 27.11400032043457,
                                            "altitude": 0,
                                            "latitude": -27.4664077758789,
                                            "longitude": 153.024993896484,
                                            "timestamp": "2019-07-12 06:10:50Z"
                                        },
                                        {
                                            "__index__": 1,
                                            "accuracy": 18.224000930786133,
                                            "altitude": 0,
                                            "latitude": -27.4666042327881,
                                            "longitude": 153.025054931641,
                                            "timestamp": "2019-07-12 06:11:17Z"
                                        },
                                        {
                                            "__index__": 2,
                                            "accuracy": 19.29599952697754,
                                            "altitude": 0,
                                            "latitude": -27.4666175842285,
                                            "longitude": 153.025039672852,
                                            "timestamp": "2019-07-12 06:11:19Z"
                                        }
                                    ]
                                },
                                "displayType": "dataframe"
                            }
                        ]
                    }
                ]
            },
            {
                "cellType": "markdown",
                "code": "## Helper functions\r\n\r\nWe need to be able to compute the distance between GPS coordinates so let's define some helper functions to do that.",
                "errors": [],
                "id": "58708ee0-a85c-11e9-b28b-71ec12408101",
                "lastEvaluationDate": "2019-07-17T16:30:57.232+10:00",
                "output": []
            },
            {
                "cellScope": "global",
                "cellType": "code",
                "code": "// Calculate the distance between two lat/long coordinates\r\n// Taken from https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula\r\n\r\nfunction deg2rad(deg) {\r\n    return deg * (Math.PI / 180)\r\n}\r\n\r\nfunction getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {\r\n    var R = 6371; // Radius of the earth in km\r\n    var dLat = deg2rad(lat2 - lat1);  // deg2rad below\r\n    var dLon = deg2rad(lon2 - lon1);\r\n    var a =\r\n        Math.sin(dLat / 2) * Math.sin(dLat / 2) +\r\n        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *\r\n        Math.sin(dLon / 2) * Math.sin(dLon / 2)\r\n        ;\r\n    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));\r\n    var d = R * c; // Distance in km\r\n    return d;\r\n}",
                "errors": [],
                "id": "62971ef0-a764-11e9-8194-df826e3e75d6",
                "lastEvaluationDate": "2019-07-17T16:34:50.609+10:00",
                "output": []
            },
            {
                "cellType": "markdown",
                "code": "## Transform and summarize\r\n\r\nNow let's transform our data to compute distance and speed.",
                "errors": [],
                "id": "b35dfe50-a85c-11e9-85b7-094d78d4bbdd",
                "lastEvaluationDate": "2019-07-17T16:37:12.147+10:00",
                "output": []
            },
            {
                "cellScope": "global",
                "cellType": "code",
                "code": "\r\nconst transformedData = gpsPings\r\n    .parseDates('timestamp')        // Make sure our dates are parsed to JavaScript Date objects.\r\n    .where(p => p.accuracy <= 20)   // Exclude low accuracy pings.\r\n    .rollingWindow(2)               // Group data by pairs.\r\n    .select(w => {                  // Transfom the data, find distance and time between point and compute speed.\r\n        const prev = w.first();\r\n        const curr = w.last();\r\n        const distance = getDistanceFromLatLonInKm(\r\n            prev.latitude, prev.longitude,\r\n            curr.latitude, curr.longitude\r\n        );\r\n        const time = (curr.timestamp - prev.timestamp) / 1000;\r\n        const speed = ((60 * 60) / time) * distance;\r\n        return { distance, speed };\r\n    })\r\n    .inflate() \r\n    .rollingWindow(10)              // Summarize the data with a 10 period sum and average.\r\n    .select(window =>\r\n        window.summarize({          // Create a summary of each 10 period data window.\r\n            distance: Series.sum,\r\n            speed: Series.average\r\n        })\r\n    )\r\n    .inflate();",
                "errors": [],
                "id": "11181670-a759-11e9-8194-df826e3e75d6",
                "lastEvaluationDate": "2019-07-17T16:34:50.615+10:00",
                "output": []
            },
            {
                "cellType": "markdown",
                "code": "## Preview transformed data\r\n\r\nWe better preview the transformed data not to make sure we haven't messed it up.",
                "errors": [],
                "id": "cfe24180-a85c-11e9-85b7-094d78d4bbdd",
                "lastEvaluationDate": "2019-07-17T16:37:12.147+10:00",
                "output": []
            },
            {
                "cellScope": "global",
                "cellType": "code",
                "code": "display(transformedData.head(3));",
                "errors": [
                    {
                        "msg": "window.summarize is not a function\r\nat SelectIterator.gpsPings.parseDates.where.rollingWindow.select.rollingWindow.select.window [as selector] (16:48)\nat wrapperFn (1:3)"
                    }
                ],
                "id": "e54765f0-a85c-11e9-85b7-094d78d4bbdd",
                "lastEvaluationDate": "2019-07-17T16:34:50.622+10:00",
                "output": []
            },
            {
                "cellType": "markdown",
                "code": "## Plot the data\r\n\r\nFinally let's plot the data to get a better feel for it.",
                "errors": [],
                "id": "ea00f660-a85c-11e9-85b7-094d78d4bbdd",
                "lastEvaluationDate": "2019-07-17T16:37:12.147+10:00",
                "output": []
            },
            {
                "cellScope": "global",
                "cellType": "code",
                "code": "display(transformedData.plot());",
                "errors": [],
                "id": "f47c1160-a85c-11e9-85b7-094d78d4bbdd",
                "lastEvaluationDate": "2019-07-17T16:34:50.631+10:00",
                "output": []
            }
        ],
        "id": "48e468c0-a758-11e9-8194-df826e3e75d6",
        "language": "javascript"
    },
    "version": 1
};