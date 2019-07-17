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
                "code": "## Load the data\r\n\r\nFirst we need to load the record data for the server pings.\r\n\r\nThis data is stored in a JSON file so we use Data-Forge's functions for reading files and parsing JSON data.",
                "errors": [],
                "id": "f5aa74b0-a85b-11e9-b28b-71ec12408101",
                "lastEvaluationDate": "2019-07-17T16:30:57.232+10:00",
                "output": []
            },
            {
                "cellScope": "global",
                "cellType": "code",
                "code": "const { DataFrame, Series } = require('data-forge');\r\nconst { readFile } = require('data-forge-fs');\r\nrequire('data-forge-plot');\r\n\r\nconst gpsPings = await readFile(\"ping-data.json\").parseJSON(); // Load the JSON data file.",
                "errors": [],
                "id": "48e468c1-a758-11e9-8194-df826e3e75d6",
                "lastEvaluationDate": "2019-07-18T07:55:12.745+10:00",
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
                "lastEvaluationDate": "2019-07-18T07:55:12.757+10:00",
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
                "code": "## Helper functions\r\n\r\nWe need to be able to compute the distance between GPS coordinates, so now let's define some helper functions to do that.",
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
                "lastEvaluationDate": "2019-07-18T07:55:12.767+10:00",
                "output": []
            },
            {
                "cellType": "markdown",
                "code": "## Transform and summarize\r\n\r\nNow we transform our data to compute the distance and speed between pings to the server.",
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
                "lastEvaluationDate": "2019-07-18T07:55:12.773+10:00",
                "output": []
            },
            {
                "cellType": "markdown",
                "code": "## Preview transformed data\r\n\r\nAgain we should preview our data, to make sure we haven't messed it up.",
                "errors": [],
                "id": "cfe24180-a85c-11e9-85b7-094d78d4bbdd",
                "lastEvaluationDate": "2019-07-17T16:37:12.147+10:00",
                "output": []
            },
            {
                "cellScope": "global",
                "cellType": "code",
                "code": "display(transformedData.head(3));",
                "errors": [],
                "id": "e54765f0-a85c-11e9-85b7-094d78d4bbdd",
                "lastEvaluationDate": "2019-07-18T07:55:12.778+10:00",
                "output": [
                    {
                        "values": [
                            {
                                "data": {
                                    "columnOrder": [
                                        "distance",
                                        "speed"
                                    ],
                                    "columns": {
                                        "distance": "number",
                                        "speed": "number"
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
                                            "distance": 0.051252357549683845,
                                            "speed": 7.528146123546532
                                        },
                                        {
                                            "__index__": 1,
                                            "distance": 0.05070207602098594,
                                            "speed": 7.710626512186122
                                        },
                                        {
                                            "__index__": 2,
                                            "distance": 0.05514563288690691,
                                            "speed": 7.509741212574426
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
                "code": "## Plot the data\r\n\r\nFinally let's plot the data to get a better feel for the shape of it.",
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
                "lastEvaluationDate": "2019-07-18T07:55:12.789+10:00",
                "output": [
                    {
                        "values": [
                            {
                                "data": {
                                    "axisMap": {
                                        "y": [
                                            {
                                                "series": "distance"
                                            },
                                            {
                                                "series": "speed"
                                            }
                                        ],
                                        "y2": []
                                    },
                                    "data": {
                                        "columnOrder": [
                                            "distance",
                                            "speed"
                                        ],
                                        "columns": {
                                            "distance": "number",
                                            "speed": "number"
                                        },
                                        "index": {
                                            "type": "number",
                                            "values": [
                                                0,
                                                1,
                                                2,
                                                3,
                                                4,
                                                5,
                                                6,
                                                7,
                                                8,
                                                9,
                                                10,
                                                11,
                                                12,
                                                13,
                                                14,
                                                15,
                                                16,
                                                17,
                                                18,
                                                19,
                                                20,
                                                21,
                                                22,
                                                23,
                                                24,
                                                25,
                                                26,
                                                27,
                                                28,
                                                29,
                                                30,
                                                31,
                                                32,
                                                33,
                                                34,
                                                35,
                                                36,
                                                37,
                                                38,
                                                39,
                                                40,
                                                41,
                                                42,
                                                43,
                                                44,
                                                45,
                                                46,
                                                47,
                                                48,
                                                49,
                                                50,
                                                51,
                                                52,
                                                53,
                                                54,
                                                55,
                                                56,
                                                57,
                                                58,
                                                59,
                                                60,
                                                61,
                                                62,
                                                63,
                                                64,
                                                65,
                                                66,
                                                67,
                                                68,
                                                69,
                                                70,
                                                71,
                                                72,
                                                73,
                                                74,
                                                75,
                                                76,
                                                77,
                                                78,
                                                79,
                                                80,
                                                81,
                                                82,
                                                83,
                                                84,
                                                85,
                                                86,
                                                87,
                                                88,
                                                89,
                                                90,
                                                91,
                                                92,
                                                93,
                                                94,
                                                95,
                                                96,
                                                97,
                                                98,
                                                99,
                                                100,
                                                101,
                                                102,
                                                103,
                                                104,
                                                105,
                                                106,
                                                107,
                                                108,
                                                109,
                                                110,
                                                111,
                                                112,
                                                113,
                                                114,
                                                115,
                                                116,
                                                117,
                                                118,
                                                119,
                                                120,
                                                121,
                                                122,
                                                123,
                                                124,
                                                125,
                                                126,
                                                127,
                                                128,
                                                129,
                                                130,
                                                131,
                                                132,
                                                133,
                                                134,
                                                135,
                                                136,
                                                137,
                                                138,
                                                139,
                                                140,
                                                141,
                                                142,
                                                143,
                                                144,
                                                145,
                                                146,
                                                147,
                                                148,
                                                149,
                                                150,
                                                151,
                                                152,
                                                153,
                                                154,
                                                155,
                                                156,
                                                157,
                                                158,
                                                159,
                                                160,
                                                161,
                                                162,
                                                163,
                                                164,
                                                165,
                                                166,
                                                167,
                                                168,
                                                169,
                                                170,
                                                171,
                                                172,
                                                173,
                                                174,
                                                175,
                                                176,
                                                177,
                                                178,
                                                179,
                                                180,
                                                181,
                                                182,
                                                183,
                                                184,
                                                185,
                                                186,
                                                187,
                                                188,
                                                189,
                                                190,
                                                191,
                                                192,
                                                193,
                                                194,
                                                195,
                                                196,
                                                197,
                                                198,
                                                199,
                                                200,
                                                201,
                                                202,
                                                203,
                                                204,
                                                205,
                                                206,
                                                207,
                                                208,
                                                209,
                                                210,
                                                211,
                                                212,
                                                213,
                                                214,
                                                215,
                                                216,
                                                217,
                                                218,
                                                219,
                                                220,
                                                221,
                                                222,
                                                223,
                                                224,
                                                225,
                                                226,
                                                227,
                                                228,
                                                229,
                                                230,
                                                231,
                                                232,
                                                233,
                                                234,
                                                235,
                                                236,
                                                237,
                                                238,
                                                239,
                                                240,
                                                241,
                                                242,
                                                243,
                                                244,
                                                245,
                                                246,
                                                247,
                                                248,
                                                249,
                                                250,
                                                251,
                                                252,
                                                253,
                                                254,
                                                255,
                                                256,
                                                257,
                                                258,
                                                259,
                                                260,
                                                261,
                                                262,
                                                263,
                                                264,
                                                265,
                                                266,
                                                267,
                                                268,
                                                269,
                                                270,
                                                271,
                                                272,
                                                273,
                                                274,
                                                275,
                                                276,
                                                277,
                                                278,
                                                279,
                                                280,
                                                281,
                                                282,
                                                283,
                                                284,
                                                285,
                                                286,
                                                287,
                                                288,
                                                289,
                                                290,
                                                291,
                                                292,
                                                293,
                                                294,
                                                295,
                                                296,
                                                297,
                                                298,
                                                299,
                                                300,
                                                301,
                                                302,
                                                303,
                                                304,
                                                305,
                                                306,
                                                307,
                                                308,
                                                309,
                                                310,
                                                311,
                                                312,
                                                313,
                                                314,
                                                315,
                                                316,
                                                317,
                                                318,
                                                319,
                                                320,
                                                321,
                                                322,
                                                323,
                                                324,
                                                325,
                                                326,
                                                327,
                                                328,
                                                329,
                                                330,
                                                331,
                                                332,
                                                333,
                                                334,
                                                335,
                                                336,
                                                337,
                                                338,
                                                339,
                                                340,
                                                341,
                                                342,
                                                343,
                                                344,
                                                345,
                                                346,
                                                347,
                                                348,
                                                349,
                                                350,
                                                351,
                                                352,
                                                353,
                                                354,
                                                355,
                                                356,
                                                357,
                                                358,
                                                359,
                                                360,
                                                361,
                                                362,
                                                363,
                                                364,
                                                365,
                                                366,
                                                367,
                                                368,
                                                369,
                                                370,
                                                371,
                                                372,
                                                373,
                                                374,
                                                375,
                                                376,
                                                377,
                                                378,
                                                379,
                                                380,
                                                381,
                                                382,
                                                383,
                                                384,
                                                385,
                                                386,
                                                387,
                                                388,
                                                389,
                                                390,
                                                391,
                                                392,
                                                393,
                                                394,
                                                395,
                                                396,
                                                397,
                                                398,
                                                399,
                                                400,
                                                401,
                                                402,
                                                403,
                                                404,
                                                405,
                                                406,
                                                407,
                                                408,
                                                409,
                                                410,
                                                411,
                                                412,
                                                413,
                                                414,
                                                415,
                                                416,
                                                417,
                                                418,
                                                419,
                                                420,
                                                421,
                                                422,
                                                423,
                                                424,
                                                425,
                                                426,
                                                427,
                                                428,
                                                429,
                                                430,
                                                431,
                                                432,
                                                433,
                                                434,
                                                435,
                                                436,
                                                437,
                                                438,
                                                439,
                                                440,
                                                441,
                                                442,
                                                443,
                                                444,
                                                445,
                                                446,
                                                447,
                                                448,
                                                449,
                                                450,
                                                451,
                                                452,
                                                453,
                                                454,
                                                455,
                                                456,
                                                457,
                                                458,
                                                459,
                                                460,
                                                461,
                                                462,
                                                463,
                                                464,
                                                465,
                                                466,
                                                467,
                                                468,
                                                469,
                                                470,
                                                471,
                                                472,
                                                473,
                                                474,
                                                475,
                                                476,
                                                477,
                                                478,
                                                479,
                                                480,
                                                481,
                                                482,
                                                483,
                                                484,
                                                485,
                                                486,
                                                487,
                                                488,
                                                489,
                                                490,
                                                491,
                                                492
                                            ]
                                        },
                                        "values": [
                                            {
                                                "distance": 0.051252357549683845,
                                                "speed": 7.528146123546532
                                            },
                                            {
                                                "distance": 0.05070207602098594,
                                                "speed": 7.710626512186122
                                            },
                                            {
                                                "distance": 0.05514563288690691,
                                                "speed": 7.509741212574426
                                            },
                                            {
                                                "distance": 0.053629695698477683,
                                                "speed": 6.906740203045838
                                            },
                                            {
                                                "distance": 0.05253793340583768,
                                                "speed": 6.879410213947153
                                            },
                                            {
                                                "distance": 0.051901670931509075,
                                                "speed": 6.6503557231888575
                                            },
                                            {
                                                "distance": 0.05004606737880575,
                                                "speed": 5.6387567081848795
                                            },
                                            {
                                                "distance": 0.048095609467785294,
                                                "speed": 4.936591860217516
                                            },
                                            {
                                                "distance": 0.043554697435582074,
                                                "speed": 3.301863528624355
                                            },
                                            {
                                                "distance": 0.016323077277007048,
                                                "speed": 3.5221936968155823
                                            },
                                            {
                                                "distance": 0.017900380120292745,
                                                "speed": 4.090022720398433
                                            },
                                            {
                                                "distance": 0.019293283461978488,
                                                "speed": 4.5914679234053
                                            },
                                            {
                                                "distance": 0.016934212028737475,
                                                "speed": 5.5427679787817805
                                            },
                                            {
                                                "distance": 0.020079134687326396,
                                                "speed": 6.732203757567857
                                            },
                                            {
                                                "distance": 0.026572783266341504,
                                                "speed": 7.939236250250292
                                            },
                                            {
                                                "distance": 0.031222723176291434,
                                                "speed": 9.613214617832266
                                            },
                                            {
                                                "distance": 0.040977963839302745,
                                                "speed": 11.483685182517897
                                            },
                                            {
                                                "distance": 0.05202295595676705,
                                                "speed": 13.280905022761342
                                            },
                                            {
                                                "distance": 0.05574005905994617,
                                                "speed": 14.619062139905825
                                            },
                                            {
                                                "distance": 0.058340913733224586,
                                                "speed": 15.555369822286053
                                            },
                                            {
                                                "distance": 0.09487467027290572,
                                                "speed": 16.20985912409632
                                            },
                                            {
                                                "distance": 0.1039910426535693,
                                                "speed": 17.31855248730712
                                            },
                                            {
                                                "distance": 0.10390277497553196,
                                                "speed": 17.286776123213677
                                            },
                                            {
                                                "distance": 0.1052430932707694,
                                                "speed": 17.76929070949915
                                            },
                                            {
                                                "distance": 0.1124311091444942,
                                                "speed": 21.64036041364194
                                            },
                                            {
                                                "distance": 0.11859681960674212,
                                                "speed": 23.860016180051197
                                            },
                                            {
                                                "distance": 0.11328513266678863,
                                                "speed": 23.93280669169717
                                            },
                                            {
                                                "distance": 0.10847272498726183,
                                                "speed": 24.37931724911122
                                            },
                                            {
                                                "distance": 0.11234414806591642,
                                                "speed": 25.773029557426867
                                            },
                                            {
                                                "distance": 0.11251848716455973,
                                                "speed": 25.83579163293847
                                            },
                                            {
                                                "distance": 0.08371705655567402,
                                                "speed": 26.007675431542584
                                            },
                                            {
                                                "distance": 0.07602390445314629,
                                                "speed": 25.411341368460697
                                            },
                                            {
                                                "distance": 0.0785341229774812,
                                                "speed": 26.315020037221267
                                            },
                                            {
                                                "distance": 0.07791932681512917,
                                                "speed": 26.093693418774535
                                            },
                                            {
                                                "distance": 0.06783005870748025,
                                                "speed": 22.461556900020916
                                            },
                                            {
                                                "distance": 0.06150370151111905,
                                                "speed": 20.18406830933089
                                            },
                                            {
                                                "distance": 0.05886497230017105,
                                                "speed": 19.23412579338961
                                            },
                                            {
                                                "distance": 0.05932153018560498,
                                                "speed": 19.398486632145826
                                            },
                                            {
                                                "distance": 0.05427805388883933,
                                                "speed": 17.58283516531019
                                            },
                                            {
                                                "distance": 0.050743422239184176,
                                                "speed": 16.310367771434333
                                            },
                                            {
                                                "distance": 0.042947079054057244,
                                                "speed": 15.460948459460607
                                            },
                                            {
                                                "distance": 0.040072320284757046,
                                                "speed": 14.426035302512535
                                            },
                                            {
                                                "distance": 0.036894208610101675,
                                                "speed": 13.281915099636597
                                            },
                                            {
                                                "distance": 0.03437571979511691,
                                                "speed": 12.375259126242087
                                            },
                                            {
                                                "distance": 0.0322613885921834,
                                                "speed": 11.614099893186022
                                            },
                                            {
                                                "distance": 0.028408357879614102,
                                                "speed": 10.227008836661078
                                            },
                                            {
                                                "distance": 0.026391445879748485,
                                                "speed": 9.500920516709455
                                            },
                                            {
                                                "distance": 0.01991439105519407,
                                                "speed": 6.825599043839081
                                            },
                                            {
                                                "distance": 0.017519089695434895,
                                                "speed": 5.96329055432578
                                            },
                                            {
                                                "distance": 0.017791994691535556,
                                                "speed": 6.06153635292202
                                            },
                                            {
                                                "distance": 0.018797175659376872,
                                                "speed": 6.423401501344893
                                            },
                                            {
                                                "distance": 0.02123414848765544,
                                                "speed": 7.300711719525178
                                            },
                                            {
                                                "distance": 0.022715827877164495,
                                                "speed": 7.834116299748436
                                            },
                                            {
                                                "distance": 0.04269868500631578,
                                                "speed": 9.210281706025807
                                            },
                                            {
                                                "distance": 0.04663704411619523,
                                                "speed": 10.628090985582409
                                            },
                                            {
                                                "distance": 0.05291855715292752,
                                                "speed": 12.889435678806034
                                            },
                                            {
                                                "distance": 0.055667054703766365,
                                                "speed": 13.878894797108018
                                            },
                                            {
                                                "distance": 0.05666281309325353,
                                                "speed": 14.580949553354179
                                            },
                                            {
                                                "distance": 0.0598904636885335,
                                                "speed": 15.742903767654965
                                            },
                                            {
                                                "distance": 0.06350852578657372,
                                                "speed": 17.04540612294945
                                            },
                                            {
                                                "distance": 0.06396216619194528,
                                                "speed": 17.208716668883206
                                            },
                                            {
                                                "distance": 0.0627962821443166,
                                                "speed": 16.28922569432083
                                            },
                                            {
                                                "distance": 0.059774190652063415,
                                                "speed": 14.883141522276143
                                            },
                                            {
                                                "distance": 0.03995530080474367,
                                                "speed": 13.566004337458129
                                            },
                                            {
                                                "distance": 0.035536980522162656,
                                                "speed": 11.681223075847758
                                            },
                                            {
                                                "distance": 0.030041483967525498,
                                                "speed": 9.23214678036845
                                            },
                                            {
                                                "distance": 0.026868811430508895,
                                                "speed": 7.899105924743891
                                            },
                                            {
                                                "distance": 0.026105959387721558,
                                                "speed": 7.084501862081824
                                            },
                                            {
                                                "distance": 0.0565947436669644,
                                                "speed": 5.4952699319604275
                                            },
                                            {
                                                "distance": 0.0528335601333661,
                                                "speed": 4.141243859865035
                                            },
                                            {
                                                "distance": 0.05056567841207447,
                                                "speed": 3.324806440200048
                                            },
                                            {
                                                "distance": 0.04963059261221192,
                                                "speed": 3.487948269665579
                                            },
                                            {
                                                "distance": 0.04941850512445613,
                                                "speed": 3.729728008907036
                                            },
                                            {
                                                "distance": 0.05029134915718772,
                                                "speed": 3.5757980005048835
                                            },
                                            {
                                                "distance": 0.050353682637176975,
                                                "speed": 3.8924240131822216
                                            },
                                            {
                                                "distance": 0.05186067628626042,
                                                "speed": 4.905639262662193
                                            },
                                            {
                                                "distance": 0.05493675815070454,
                                                "speed": 6.203907476160657
                                            },
                                            {
                                                "distance": 0.05724890170052902,
                                                "speed": 7.576256481356097
                                            },
                                            {
                                                "distance": 0.026199793791595656,
                                                "speed": 8.963771904788906
                                            },
                                            {
                                                "distance": 0.02872956369108711,
                                                "speed": 9.87448906860583
                                            },
                                            {
                                                "distance": 0.03133928933656857,
                                                "speed": 10.813990300979157
                                            },
                                            {
                                                "distance": 0.09820360739618328,
                                                "speed": 10.975544722375671
                                            },
                                            {
                                                "distance": 0.09932647278235056,
                                                "speed": 11.024957498781697
                                            },
                                            {
                                                "distance": 0.10401866737293122,
                                                "speed": 13.182301411576267
                                            },
                                            {
                                                "distance": 0.11047414598765196,
                                                "speed": 15.506273712875734
                                            },
                                            {
                                                "distance": 0.11186937772037048,
                                                "speed": 16.008557136654396
                                            },
                                            {
                                                "distance": 0.11838827499256846,
                                                "speed": 18.355360154645673
                                            },
                                            {
                                                "distance": 0.1171715634977517,
                                                "speed": 17.917344016511635
                                            },
                                            {
                                                "distance": 0.12359158493151028,
                                                "speed": 20.228551732664727
                                            },
                                            {
                                                "distance": 0.12120495468509766,
                                                "speed": 19.369364843956188
                                            },
                                            {
                                                "distance": 0.1691372080451632,
                                                "speed": 18.801511391654657
                                            },
                                            {
                                                "distance": 0.11207730175797306,
                                                "speed": 20.07329381585377
                                            },
                                            {
                                                "distance": 0.11638882676877485,
                                                "speed": 21.980261582356597
                                            },
                                            {
                                                "distance": 0.12922023468323973,
                                                "speed": 26.59956843156396
                                            },
                                            {
                                                "distance": 0.13438433581942438,
                                                "speed": 28.45864484059043
                                            },
                                            {
                                                "distance": 0.1433506957649709,
                                                "speed": 31.686534420987186
                                            },
                                            {
                                                "distance": 0.1626380302067839,
                                                "speed": 33.3166311305388
                                            },
                                            {
                                                "distance": 0.17150202149685242,
                                                "speed": 36.50766799496347
                                            },
                                            {
                                                "distance": 0.1705788392731562,
                                                "speed": 36.175322394432825
                                            },
                                            {
                                                "distance": 0.178188612616424,
                                                "speed": 38.91484079800922
                                            },
                                            {
                                                "distance": 0.13353056138303812,
                                                "speed": 40.66140701591544
                                            },
                                            {
                                                "distance": 0.1293094368996459,
                                                "speed": 41.23805359437145
                                            },
                                            {
                                                "distance": 0.20652954514740862,
                                                "speed": 42.31638100951128
                                            },
                                            {
                                                "distance": 0.1969625994054027,
                                                "speed": 38.872280542389156
                                            },
                                            {
                                                "distance": 0.19268165666283188,
                                                "speed": 37.33114115506364
                                            },
                                            {
                                                "distance": 0.1857163290859461,
                                                "speed": 34.823623227384765
                                            },
                                            {
                                                "distance": 0.16282082196153122,
                                                "speed": 31.894584352096484
                                            },
                                            {
                                                "distance": 0.15664745741125585,
                                                "speed": 29.67217311399735
                                            },
                                            {
                                                "distance": 0.15011774068199663,
                                                "speed": 27.32147509146403
                                            },
                                            {
                                                "distance": 0.14644640824608354,
                                                "speed": 25.999795414535335
                                            },
                                            {
                                                "distance": 0.15417237450080026,
                                                "speed": 24.970379901522755
                                            },
                                            {
                                                "distance": 0.15010471801334785,
                                                "speed": 23.506023566039865
                                            },
                                            {
                                                "distance": 0.07130326415410827,
                                                "speed": 21.85841173076837
                                            },
                                            {
                                                "distance": 0.06410281369454056,
                                                "speed": 18.66197857051352
                                            },
                                            {
                                                "distance": 0.057668352914661616,
                                                "speed": 16.345572689757095
                                            },
                                            {
                                                "distance": 0.0526510667817919,
                                                "speed": 14.539349681923998
                                            },
                                            {
                                                "distance": 0.049068674003075075,
                                                "speed": 13.249688281585936
                                            },
                                            {
                                                "distance": 0.046969410870526696,
                                                "speed": 12.493953553868522
                                            },
                                            {
                                                "distance": 0.04696940808454153,
                                                "speed": 12.493952550913864
                                            },
                                            {
                                                "distance": 0.04567078633392729,
                                                "speed": 12.02644872069273
                                            },
                                            {
                                                "distance": 0.03443184393511292,
                                                "speed": 11.79119282183017
                                            },
                                            {
                                                "distance": 0.03715613325450082,
                                                "speed": 12.771936976809815
                                            },
                                            {
                                                "distance": 0.03705013803831506,
                                                "speed": 12.733778698982942
                                            },
                                            {
                                                "distance": 0.03828847638781578,
                                                "speed": 13.78385149961368
                                            },
                                            {
                                                "distance": 0.04059081064479904,
                                                "speed": 14.612691832127652
                                            },
                                            {
                                                "distance": 0.043299193319230336,
                                                "speed": 15.587709594922922
                                            },
                                            {
                                                "distance": 0.04436221361680928,
                                                "speed": 15.970396902051345
                                            },
                                            {
                                                "distance": 0.045670974333987396,
                                                "speed": 16.441550760235465
                                            },
                                            {
                                                "distance": 0.047913939567929886,
                                                "speed": 17.24901824445476
                                            },
                                            {
                                                "distance": 0.04826481702571282,
                                                "speed": 17.37533412925662
                                            },
                                            {
                                                "distance": 0.048827333931986405,
                                                "speed": 17.577840215515103
                                            },
                                            {
                                                "distance": 0.04550312190946664,
                                                "speed": 16.381123887407988
                                            },
                                            {
                                                "distance": 0.0436842615064841,
                                                "speed": 15.726334142334276
                                            },
                                            {
                                                "distance": 0.041357175852845034,
                                                "speed": 14.888583307024211
                                            },
                                            {
                                                "distance": 0.0375144028930776,
                                                "speed": 13.505185041507938
                                            },
                                            {
                                                "distance": 0.035400045377174436,
                                                "speed": 12.744016335782796
                                            },
                                            {
                                                "distance": 0.03256887387820561,
                                                "speed": 11.724794596154018
                                            },
                                            {
                                                "distance": 0.03003912399541447,
                                                "speed": 10.814084638349208
                                            },
                                            {
                                                "distance": 0.025375701090760892,
                                                "speed": 9.13525239267392
                                            },
                                            {
                                                "distance": 0.024353261656611638,
                                                "speed": 7.6648714430632126
                                            },
                                            {
                                                "distance": 0.022279690929465575,
                                                "speed": 6.355312777301309
                                            },
                                            {
                                                "distance": 0.02125060371964218,
                                                "speed": 5.984841381764886
                                            },
                                            {
                                                "distance": 0.02909019901134194,
                                                "speed": 5.749648973899461
                                            },
                                            {
                                                "distance": 0.049127074845515664,
                                                "speed": 12.962924274202004
                                            },
                                            {
                                                "distance": 0.05856740421042286,
                                                "speed": 16.361442845568597
                                            },
                                            {
                                                "distance": 0.06381949417390044,
                                                "speed": 18.252195232420522
                                            },
                                            {
                                                "distance": 0.07272716881134048,
                                                "speed": 21.458958101898936
                                            },
                                            {
                                                "distance": 0.08055448106863242,
                                                "speed": 24.27679051452403
                                            },
                                            {
                                                "distance": 0.09221477694592675,
                                                "speed": 28.474497030349994
                                            },
                                            {
                                                "distance": 0.10203561928209073,
                                                "speed": 33.112303024686
                                            },
                                            {
                                                "distance": 0.11033962135927469,
                                                "speed": 36.66481697646155
                                            },
                                            {
                                                "distance": 0.11974866961491983,
                                                "speed": 40.0520743484938
                                            },
                                            {
                                                "distance": 0.11974867750631873,
                                                "speed": 43.109523902274745
                                            },
                                            {
                                                "distance": 0.105017678230848,
                                                "speed": 37.80636416310528
                                            },
                                            {
                                                "distance": 0.40622022020879894,
                                                "speed": 34.65297744605704
                                            },
                                            {
                                                "distance": 0.40384352412367097,
                                                "speed": 32.15074701298675
                                            },
                                            {
                                                "distance": 0.3952274675223572,
                                                "speed": 28.767420899323866
                                            },
                                            {
                                                "distance": 0.38585309245608623,
                                                "speed": 25.26539338067961
                                            },
                                            {
                                                "distance": 0.37484997612322957,
                                                "speed": 20.870679002972853
                                            },
                                            {
                                                "distance": 0.36251067403153137,
                                                "speed": 16.428530249961515
                                            },
                                            {
                                                "distance": 0.35559507585102906,
                                                "speed": 12.854933697791314
                                            },
                                            {
                                                "distance": 0.3489944401456813,
                                                "speed": 10.478704843866122
                                            },
                                            {
                                                "distance": 0.3413968166886311,
                                                "speed": 7.743560399328049
                                            },
                                            {
                                                "distance": 0.3368634156475267,
                                                "speed": 6.11153602453046
                                            },
                                            {
                                                "distance": 0.029696569668834893,
                                                "speed": 7.1177733013120115
                                            },
                                            {
                                                "distance": 0.02576725002713559,
                                                "speed": 7.349838072724488
                                            },
                                            {
                                                "distance": 0.02572350162613873,
                                                "speed": 7.615634385555528
                                            },
                                            {
                                                "distance": 0.02831038529191383,
                                                "speed": 8.674165000021276
                                            },
                                            {
                                                "distance": 0.027016943276702985,
                                                "speed": 8.642118372423715
                                            },
                                            {
                                                "distance": 0.02695832959241923,
                                                "speed": 8.621017446081567
                                            },
                                            {
                                                "distance": 0.02329009119437498,
                                                "speed": 8.384432829974992
                                            },
                                            {
                                                "distance": 0.020317771242386824,
                                                "speed": 6.939003379140741
                                            },
                                            {
                                                "distance": 0.018863395172152277,
                                                "speed": 6.133882292767418
                                            },
                                            {
                                                "distance": 0.018900154041452417,
                                                "speed": 5.316177481154446
                                            },
                                            {
                                                "distance": 0.014575778719152072,
                                                "speed": 3.6906860179414998
                                            },
                                            {
                                                "distance": 0.016533859597021368,
                                                "speed": 3.360674562171513
                                            },
                                            {
                                                "distance": 0.022567952088207995,
                                                "speed": 5.532947858998698
                                            },
                                            {
                                                "distance": 0.027087525828098837,
                                                "speed": 7.1599944053594005
                                            },
                                            {
                                                "distance": 0.03293107339894846,
                                                "speed": 9.263671530865267
                                            },
                                            {
                                                "distance": 0.040481098896088016,
                                                "speed": 11.981680709835505
                                            },
                                            {
                                                "distance": 0.04772482864787584,
                                                "speed": 14.589423420479122
                                            },
                                            {
                                                "distance": 0.053795133149488875,
                                                "speed": 17.15012730917833
                                            },
                                            {
                                                "distance": 0.061286546460173896,
                                                "speed": 20.12858180211382
                                            },
                                            {
                                                "distance": 0.06725212784594026,
                                                "speed": 23.107129105550737
                                            },
                                            {
                                                "distance": 0.07908614182026652,
                                                "speed": 27.436090483493007
                                            },
                                            {
                                                "distance": 0.08967701099312048,
                                                "speed": 32.283723957523364
                                            },
                                            {
                                                "distance": 0.09594729653140549,
                                                "speed": 34.54102675130598
                                            },
                                            {
                                                "distance": 0.09747222616147716,
                                                "speed": 35.09000141813178
                                            },
                                            {
                                                "distance": 0.10405137267867799,
                                                "speed": 37.45849416432408
                                            },
                                            {
                                                "distance": 0.10730602425250386,
                                                "speed": 38.630168730901396
                                            },
                                            {
                                                "distance": 0.11128803335830659,
                                                "speed": 40.06369200899038
                                            },
                                            {
                                                "distance": 0.11569783421044691,
                                                "speed": 41.65122031576089
                                            },
                                            {
                                                "distance": 0.11877768107017068,
                                                "speed": 42.75996518526145
                                            },
                                            {
                                                "distance": 0.12332576570690384,
                                                "speed": 44.39727565448539
                                            },
                                            {
                                                "distance": 0.12363546500962752,
                                                "speed": 44.50876740346591
                                            },
                                            {
                                                "distance": 0.1207005077279563,
                                                "speed": 43.45218278206427
                                            },
                                            {
                                                "distance": 0.12043215999576087,
                                                "speed": 43.355577598473914
                                            },
                                            {
                                                "distance": 0.12353977599984939,
                                                "speed": 44.474319359945774
                                            },
                                            {
                                                "distance": 0.11853945583088028,
                                                "speed": 42.6742040991169
                                            },
                                            {
                                                "distance": 0.11830334841731882,
                                                "speed": 42.58920543023477
                                            },
                                            {
                                                "distance": 0.11526494348269886,
                                                "speed": 41.49537965377159
                                            },
                                            {
                                                "distance": 0.11241185444410827,
                                                "speed": 40.468267599878985
                                            },
                                            {
                                                "distance": 0.10853362358181842,
                                                "speed": 39.07210448945463
                                            },
                                            {
                                                "distance": 0.1057362777001622,
                                                "speed": 38.06505997205839
                                            },
                                            {
                                                "distance": 0.09890500671271875,
                                                "speed": 35.60580241657874
                                            },
                                            {
                                                "distance": 0.09194296032895026,
                                                "speed": 33.09946571842209
                                            },
                                            {
                                                "distance": 0.08142733253302668,
                                                "speed": 28.766496236635646
                                            },
                                            {
                                                "distance": 0.0707487669497565,
                                                "speed": 24.922212626658386
                                            },
                                            {
                                                "distance": 0.0662425993299887,
                                                "speed": 23.299992283541986
                                            },
                                            {
                                                "distance": 0.056010010121548694,
                                                "speed": 19.284788404645987
                                            },
                                            {
                                                "distance": 0.05033149694355943,
                                                "speed": 17.240523660569846
                                            },
                                            {
                                                "distance": 0.04270448436383321,
                                                "speed": 14.11940396724512
                                            },
                                            {
                                                "distance": 0.03601145874101093,
                                                "speed": 11.259440559921442
                                            },
                                            {
                                                "distance": 0.02673798865510779,
                                                "speed": 7.398527213402848
                                            },
                                            {
                                                "distance": 0.0411542311779831,
                                                "speed": 12.58837452163796
                                            },
                                            {
                                                "distance": 0.050991648525840955,
                                                "speed": 16.12984476686679
                                            },
                                            {
                                                "distance": 0.06202817530393985,
                                                "speed": 20.650337882236343
                                            },
                                            {
                                                "distance": 0.07159262632338445,
                                                "speed": 24.093540249236398
                                            },
                                            {
                                                "distance": 0.08123371064337255,
                                                "speed": 27.564330604432115
                                            },
                                            {
                                                "distance": 0.08993947327042201,
                                                "speed": 31.029876914027522
                                            },
                                            {
                                                "distance": 0.09759074533270524,
                                                "speed": 33.78433485644949
                                            },
                                            {
                                                "distance": 0.117257179529893,
                                                "speed": 41.23964633206035
                                            },
                                            {
                                                "distance": 0.1278284608313264,
                                                "speed": 45.49578178368404
                                            },
                                            {
                                                "distance": 0.13857620251512934,
                                                "speed": 49.88743290544655
                                            },
                                            {
                                                "distance": 0.12709305078461047,
                                                "speed": 45.75349828245976
                                            },
                                            {
                                                "distance": 0.11538476079952008,
                                                "speed": 41.53851388782722
                                            },
                                            {
                                                "distance": 0.10639098284035309,
                                                "speed": 38.30075382252711
                                            },
                                            {
                                                "distance": 0.09993750730185545,
                                                "speed": 35.97750262866797
                                            },
                                            {
                                                "distance": 0.08880259147319432,
                                                "speed": 31.968932930349958
                                            },
                                            {
                                                "distance": 0.0858098383038005,
                                                "speed": 30.891541789368176
                                            },
                                            {
                                                "distance": 0.07784219700054079,
                                                "speed": 28.02319092019468
                                            },
                                            {
                                                "distance": 0.05963014734951245,
                                                "speed": 21.466853045824482
                                            },
                                            {
                                                "distance": 0.052090308036641914,
                                                "speed": 18.752510893191094
                                            },
                                            {
                                                "distance": 0.04138631703375759,
                                                "speed": 14.899074132152737
                                            },
                                            {
                                                "distance": 0.03449284536138311,
                                                "speed": 11.924717426314555
                                            },
                                            {
                                                "distance": 0.034492845829847935,
                                                "speed": 11.394362233117224
                                            },
                                            {
                                                "distance": 0.029621387417483033,
                                                "speed": 9.575193064489833
                                            },
                                            {
                                                "distance": 0.025662061971291318,
                                                "speed": 7.926507775510137
                                            },
                                            {
                                                "distance": 0.03041229444414792,
                                                "speed": 9.636591465738515
                                            },
                                            {
                                                "distance": 0.02741897913205838,
                                                "speed": 8.558997953386282
                                            },
                                            {
                                                "distance": 0.02610627979881681,
                                                "speed": 8.086426193419316
                                            },
                                            {
                                                "distance": 0.02703031579468075,
                                                "speed": 8.419079151930335
                                            },
                                            {
                                                "distance": 0.027259510724151656,
                                                "speed": 8.501589326539861
                                            },
                                            {
                                                "distance": 0.03400544091620787,
                                                "speed": 10.930124195680097
                                            },
                                            {
                                                "distance": 0.04006041009072258,
                                                "speed": 13.602620002288765
                                            },
                                            {
                                                "distance": 0.0460332879462107,
                                                "speed": 16.283211392109155
                                            },
                                            {
                                                "distance": 0.05542518799540207,
                                                "speed": 19.729739549994072
                                            },
                                            {
                                                "distance": 0.06622113465496808,
                                                "speed": 23.839608475788516
                                            },
                                            {
                                                "distance": 0.07065614947698418,
                                                "speed": 25.436213811714303
                                            },
                                            {
                                                "distance": 0.07521470765859016,
                                                "speed": 27.07729475709246
                                            },
                                            {
                                                "distance": 0.07984923026191769,
                                                "speed": 28.745722894290367
                                            },
                                            {
                                                "distance": 0.08244498148012072,
                                                "speed": 29.68019333284346
                                            },
                                            {
                                                "distance": 0.08602529001559374,
                                                "speed": 30.969104405613745
                                            },
                                            {
                                                "distance": 0.0812347785206964,
                                                "speed": 29.244520267450703
                                            },
                                            {
                                                "distance": 0.07558693593945434,
                                                "speed": 27.21129693820356
                                            },
                                            {
                                                "distance": 0.07085008774633475,
                                                "speed": 24.952074148301257
                                            },
                                            {
                                                "distance": 0.06281023963024361,
                                                "speed": 21.776183730114393
                                            },
                                            {
                                                "distance": 0.05288355620050613,
                                                "speed": 17.738015478248023
                                            },
                                            {
                                                "distance": 0.05004045610249036,
                                                "speed": 14.41723591306545
                                            },
                                            {
                                                "distance": 0.047414559810765866,
                                                "speed": 13.471913248044633
                                            },
                                            {
                                                "distance": 0.04996779045801906,
                                                "speed": 14.39107628105578
                                            },
                                            {
                                                "distance": 0.04988767034733704,
                                                "speed": 14.362233041210255
                                            },
                                            {
                                                "distance": 0.05120338522567455,
                                                "speed": 14.83589039741176
                                            },
                                            {
                                                "distance": 0.05805235692278611,
                                                "speed": 17.30152020837192
                                            },
                                            {
                                                "distance": 0.06597226988394053,
                                                "speed": 20.15268887438751
                                            },
                                            {
                                                "distance": 0.07396623543288235,
                                                "speed": 23.584473912385818
                                            },
                                            {
                                                "distance": 0.0805743396416351,
                                                "speed": 26.244936523930864
                                            },
                                            {
                                                "distance": 0.08678526297305186,
                                                "speed": 28.945431140401762
                                            },
                                            {
                                                "distance": 0.08065015258243771,
                                                "speed": 29.03405492967758
                                            },
                                            {
                                                "distance": 0.07923979238529484,
                                                "speed": 28.52632525870616
                                            },
                                            {
                                                "distance": 0.07138437445526202,
                                                "speed": 25.698374803894335
                                            },
                                            {
                                                "distance": 0.06704057081224593,
                                                "speed": 23.754014477765992
                                            },
                                            {
                                                "distance": 0.058954211994153904,
                                                "speed": 20.548724666335154
                                            },
                                            {
                                                "distance": 0.05463856318419587,
                                                "speed": 16.97169627540797
                                            },
                                            {
                                                "distance": 0.051395253628950664,
                                                "speed": 15.804104835519704
                                            },
                                            {
                                                "distance": 0.04876403889439972,
                                                "speed": 14.856867531081367
                                            },
                                            {
                                                "distance": 0.046787899164232594,
                                                "speed": 14.145457228221204
                                            },
                                            {
                                                "distance": 0.04851596218307465,
                                                "speed": 14.767559915004341
                                            },
                                            {
                                                "distance": 0.056841459026790574,
                                                "speed": 17.764738778742075
                                            },
                                            {
                                                "distance": 0.059474384637859985,
                                                "speed": 18.712591998727063
                                            },
                                            {
                                                "distance": 0.06323867643887639,
                                                "speed": 20.06773704709297
                                            },
                                            {
                                                "distance": 0.06774750443045667,
                                                "speed": 22.07150613870441
                                            },
                                            {
                                                "distance": 0.07292378333749525,
                                                "speed": 24.229167182155997
                                            },
                                            {
                                                "distance": 0.07055388342646932,
                                                "speed": 25.399398033528957
                                            },
                                            {
                                                "distance": 0.06866029350928002,
                                                "speed": 24.717705663340812
                                            },
                                            {
                                                "distance": 0.06530349394486912,
                                                "speed": 23.509257820152882
                                            },
                                            {
                                                "distance": 0.060835473661357886,
                                                "speed": 21.90077051808884
                                            },
                                            {
                                                "distance": 0.05295509060233749,
                                                "speed": 18.782289397741405
                                            },
                                            {
                                                "distance": 0.0445161781537586,
                                                "speed": 15.744280916253004
                                            },
                                            {
                                                "distance": 0.038771014064297726,
                                                "speed": 13.676021844047089
                                            },
                                            {
                                                "distance": 0.03870057126566842,
                                                "speed": 13.65066243654054
                                            },
                                            {
                                                "distance": 0.03588641774171565,
                                                "speed": 12.637567167917542
                                            },
                                            {
                                                "distance": 0.03527804805415038,
                                                "speed": 12.418554080394046
                                            },
                                            {
                                                "distance": 0.03830932914360655,
                                                "speed": 13.509815272598269
                                            },
                                            {
                                                "distance": 0.04164704621887155,
                                                "speed": 14.71139341969367
                                            },
                                            {
                                                "distance": 0.04500382092672738,
                                                "speed": 15.919832314521766
                                            },
                                            {
                                                "distance": 0.049990004672303204,
                                                "speed": 17.71485846292906
                                            },
                                            {
                                                "distance": 0.05637203553010143,
                                                "speed": 20.293932790836514
                                            },
                                            {
                                                "distance": 0.06350030560926449,
                                                "speed": 22.860110019335217
                                            },
                                            {
                                                "distance": 0.06877494798822052,
                                                "speed": 24.758981275759385
                                            },
                                            {
                                                "distance": 0.0700762247894049,
                                                "speed": 25.227440924185764
                                            },
                                            {
                                                "distance": 0.06778753232490302,
                                                "speed": 24.40351163696509
                                            },
                                            {
                                                "distance": 0.06369956334258041,
                                                "speed": 22.93184280332894
                                            },
                                            {
                                                "distance": 0.05941634746698911,
                                                "speed": 21.38988508811608
                                            },
                                            {
                                                "distance": 0.05359267856143954,
                                                "speed": 19.293364282118237
                                            },
                                            {
                                                "distance": 0.047583467185259895,
                                                "speed": 16.54659476659042
                                            },
                                            {
                                                "distance": 0.044138079735019195,
                                                "speed": 14.521724104946742
                                            },
                                            {
                                                "distance": 0.03894905726926589,
                                                "speed": 12.653676017275547
                                            },
                                            {
                                                "distance": 0.032523760075526466,
                                                "speed": 9.757115499028107
                                            },
                                            {
                                                "distance": 0.027546188468006893,
                                                "speed": 7.965189720321059
                                            },
                                            {
                                                "distance": 0.02450164937038906,
                                                "speed": 6.3271712959269175
                                            },
                                            {
                                                "distance": 0.02495253795161301,
                                                "speed": 6.48949118516754
                                            },
                                            {
                                                "distance": 0.025979546270943264,
                                                "speed": 6.859214180126429
                                            },
                                            {
                                                "distance": 0.02614938939318726,
                                                "speed": 6.9203577041342665
                                            },
                                            {
                                                "distance": 0.025722543960776754,
                                                "speed": 6.766693348466485
                                            },
                                            {
                                                "distance": 0.026369000887848507,
                                                "speed": 7.582871262315459
                                            },
                                            {
                                                "distance": 0.025071385347124525,
                                                "speed": 7.900260847211854
                                            },
                                            {
                                                "distance": 0.025583127251090403,
                                                "speed": 8.084487932639572
                                            },
                                            {
                                                "distance": 0.02357624586495756,
                                                "speed": 7.945464162132998
                                            },
                                            {
                                                "distance": 0.02434866034741675,
                                                "speed": 7.6761979414751025
                                            },
                                            {
                                                "distance": 0.024793796343826047,
                                                "speed": 8.378431249434172
                                            },
                                            {
                                                "distance": 0.023670881198929294,
                                                "speed": 7.974181797271339
                                            },
                                            {
                                                "distance": 0.02225756496595745,
                                                "speed": 7.465387953401475
                                            },
                                            {
                                                "distance": 0.021627930628690593,
                                                "speed": 7.23871959198541
                                            },
                                            {
                                                "distance": 0.020634788873738236,
                                                "speed": 6.8811885602025615
                                            },
                                            {
                                                "distance": 0.019825613562509503,
                                                "speed": 6.589885448160215
                                            },
                                            {
                                                "distance": 0.019695840866019613,
                                                "speed": 6.012817674273014
                                            },
                                            {
                                                "distance": 0.017275311540253066,
                                                "speed": 4.937823125338321
                                            },
                                            {
                                                "distance": 0.017699486522875434,
                                                "speed": 4.861471628466293
                                            },
                                            {
                                                "distance": 0.016222859268972614,
                                                "speed": 4.454907458443437
                                            },
                                            {
                                                "distance": 0.01297878660136494,
                                                "speed": 3.2259601006070526
                                            },
                                            {
                                                "distance": 0.016769789361668615,
                                                "speed": 3.000085874128347
                                            },
                                            {
                                                "distance": 0.020125189560442604,
                                                "speed": 4.208029945686984
                                            },
                                            {
                                                "distance": 0.023933076277294255,
                                                "speed": 5.578869163753578
                                            },
                                            {
                                                "distance": 0.03472165695450902,
                                                "speed": 9.462758207550895
                                            },
                                            {
                                                "distance": 0.0425886303644249,
                                                "speed": 12.294868635120611
                                            },
                                            {
                                                "distance": 0.046258920870841574,
                                                "speed": 14.146522820581456
                                            },
                                            {
                                                "distance": 0.06209696095507837,
                                                "speed": 20.051821242565442
                                            },
                                            {
                                                "distance": 0.07355973620245028,
                                                "speed": 24.407474822235404
                                            },
                                            {
                                                "distance": 0.08391315158439341,
                                                "speed": 28.557018152695985
                                            },
                                            {
                                                "distance": 0.09589603638098668,
                                                "speed": 32.931937876967176
                                            },
                                            {
                                                "distance": 0.1047596746901256,
                                                "speed": 37.71348288844522
                                            },
                                            {
                                                "distance": 0.1119873132052644,
                                                "speed": 40.31543275389518
                                            },
                                            {
                                                "distance": 0.11825531654087332,
                                                "speed": 42.57191395471439
                                            },
                                            {
                                                "distance": 0.1140431237306949,
                                                "speed": 41.05552454305016
                                            },
                                            {
                                                "distance": 0.10860921525153835,
                                                "speed": 38.25306504708803
                                            },
                                            {
                                                "distance": 0.1094295436756103,
                                                "speed": 38.54838327975393
                                            },
                                            {
                                                "distance": 0.09571237850448536,
                                                "speed": 33.07574334004477
                                            },
                                            {
                                                "distance": 0.08509795322235822,
                                                "speed": 29.254550238478988
                                            },
                                            {
                                                "distance": 0.074240850137856,
                                                "speed": 25.345993128058193
                                            },
                                            {
                                                "distance": 0.06331840279781867,
                                                "speed": 21.413912085644753
                                            },
                                            {
                                                "distance": 0.05352777954897469,
                                                "speed": 17.22106151460911
                                            },
                                            {
                                                "distance": 0.04227709798523265,
                                                "speed": 13.170816151661976
                                            },
                                            {
                                                "distance": 0.032201194663819585,
                                                "speed": 9.543490955953278
                                            },
                                            {
                                                "distance": 0.025624806796783237,
                                                "speed": 6.931666533829707
                                            },
                                            {
                                                "distance": 0.02983917752355259,
                                                "speed": 6.196092654107668
                                            },
                                            {
                                                "distance": 0.03256122084260685,
                                                "speed": 7.176028248967199
                                            },
                                            {
                                                "distance": 0.03774424707137141,
                                                "speed": 9.57637816942663
                                            },
                                            {
                                                "distance": 0.04809469813357816,
                                                "speed": 13.302540551821059
                                            },
                                            {
                                                "distance": 0.056107552582133825,
                                                "speed": 16.187168153301098
                                            },
                                            {
                                                "distance": 0.06734818962162664,
                                                "speed": 20.233797487518515
                                            },
                                            {
                                                "distance": 0.07836873004992062,
                                                "speed": 24.869418243156154
                                            },
                                            {
                                                "distance": 0.09100485934551203,
                                                "speed": 29.41842478956906
                                            },
                                            {
                                                "distance": 0.10133468253748519,
                                                "speed": 33.137161138679396
                                            },
                                            {
                                                "distance": 0.11142989423934671,
                                                "speed": 37.01576214134003
                                            },
                                            {
                                                "distance": 0.11374184297897035,
                                                "speed": 40.94706347242932
                                            },
                                            {
                                                "distance": 0.11329109468472114,
                                                "speed": 40.78479408649961
                                            },
                                            {
                                                "distance": 0.113754888603121,
                                                "speed": 40.95175989712356
                                            },
                                            {
                                                "distance": 0.11167584970205048,
                                                "speed": 40.20330589273818
                                            },
                                            {
                                                "distance": 0.11316119701421762,
                                                "speed": 40.73803092511834
                                            },
                                            {
                                                "distance": 0.10846237939046723,
                                                "speed": 39.046456580568204
                                            },
                                            {
                                                "distance": 0.10068124097174035,
                                                "speed": 36.245246749826535
                                            },
                                            {
                                                "distance": 0.11950998975844529,
                                                "speed": 37.169039516046894
                                            },
                                            {
                                                "distance": 0.12073761044640695,
                                                "speed": 37.610982963713084
                                            },
                                            {
                                                "distance": 0.12155560825222761,
                                                "speed": 37.90546217380853
                                            },
                                            {
                                                "distance": 0.12847563752936292,
                                                "speed": 40.396672713577246
                                            },
                                            {
                                                "distance": 0.15023371204202957,
                                                "speed": 42.7645131119351
                                            },
                                            {
                                                "distance": 0.25585123806121934,
                                                "speed": 44.232079744535966
                                            },
                                            {
                                                "distance": 0.2533438836004494,
                                                "speed": 43.32943213865876
                                            },
                                            {
                                                "distance": 0.2488665513155099,
                                                "speed": 41.71759251608055
                                            },
                                            {
                                                "distance": 0.25163512292098666,
                                                "speed": 42.7142782940522
                                            },
                                            {
                                                "distance": 0.25373850386998653,
                                                "speed": 43.47149543569214
                                            },
                                            {
                                                "distance": 0.2332736760240268,
                                                "speed": 41.95871420814005
                                            },
                                            {
                                                "distance": 0.2273199432446164,
                                                "speed": 39.8153704075523
                                            },
                                            {
                                                "distance": 0.22620067586898027,
                                                "speed": 39.4124341523233
                                            },
                                            {
                                                "distance": 0.2174373900878378,
                                                "speed": 36.25765127111201
                                            },
                                            {
                                                "distance": 0.19496081648155433,
                                                "speed": 33.63115119905208
                                            },
                                            {
                                                "distance": 0.08947350626896237,
                                                "speed": 32.21046225682646
                                            },
                                            {
                                                "distance": 0.08766190113076883,
                                                "speed": 31.558284407076787
                                            },
                                            {
                                                "distance": 0.08766190959178664,
                                                "speed": 31.5582874530432
                                            },
                                            {
                                                "distance": 0.08299267722767537,
                                                "speed": 29.87736380196314
                                            },
                                            {
                                                "distance": 0.08269799089719009,
                                                "speed": 29.771276722988432
                                            },
                                            {
                                                "distance": 0.07852241873621063,
                                                "speed": 28.26807074503583
                                            },
                                            {
                                                "distance": 0.07999019949160335,
                                                "speed": 28.796471816977213
                                            },
                                            {
                                                "distance": 0.07711347801134757,
                                                "speed": 27.760852084085126
                                            },
                                            {
                                                "distance": 0.0761690671908363,
                                                "speed": 27.420864188701067
                                            },
                                            {
                                                "distance": 0.07654102688579521,
                                                "speed": 27.554769678886277
                                            },
                                            {
                                                "distance": 0.07826876353859046,
                                                "speed": 28.17675487389256
                                            },
                                            {
                                                "distance": 0.08130866921552968,
                                                "speed": 29.271120917590686
                                            },
                                            {
                                                "distance": 0.081006405380347,
                                                "speed": 29.162305936924913
                                            },
                                            {
                                                "distance": 0.08190327960933359,
                                                "speed": 29.485180659360093
                                            },
                                            {
                                                "distance": 0.08010780717380961,
                                                "speed": 28.838810582571462
                                            },
                                            {
                                                "distance": 0.07759898852960179,
                                                "speed": 27.935635870656647
                                            },
                                            {
                                                "distance": 0.07460902424920683,
                                                "speed": 26.85924872971446
                                            },
                                            {
                                                "distance": 0.07114515321676732,
                                                "speed": 25.612255158036238
                                            },
                                            {
                                                "distance": 0.06583327130500792,
                                                "speed": 23.699977669802855
                                            },
                                            {
                                                "distance": 0.0628844705064858,
                                                "speed": 22.63840938233489
                                            },
                                            {
                                                "distance": 0.06161776945389175,
                                                "speed": 22.182397003401032
                                            },
                                            {
                                                "distance": 0.05813046302676785,
                                                "speed": 20.92696668963643
                                            },
                                            {
                                                "distance": 0.05787578836962498,
                                                "speed": 20.835283813064997
                                            },
                                            {
                                                "distance": 0.05864023992398607,
                                                "speed": 21.11048637263499
                                            },
                                            {
                                                "distance": 0.0525235979108298,
                                                "speed": 18.90849524789873
                                            },
                                            {
                                                "distance": 0.04887554610900569,
                                                "speed": 17.28414848378344
                                            },
                                            {
                                                "distance": 0.04434310372610553,
                                                "speed": 15.652469225939381
                                            },
                                            {
                                                "distance": 0.04215576355751372,
                                                "speed": 14.484442070365663
                                            },
                                            {
                                                "distance": 0.04066199333076443,
                                                "speed": 13.554428196640412
                                            },
                                            {
                                                "distance": 0.03641436535159964,
                                                "speed": 11.719876136652982
                                            },
                                            {
                                                "distance": 0.02963809962306673,
                                                "speed": 8.430989746116666
                                            },
                                            {
                                                "distance": 0.026070750083709047,
                                                "speed": 6.852551515386329
                                            },
                                            {
                                                "distance": 0.022814683503454242,
                                                "speed": 5.680367546494599
                                            },
                                            {
                                                "distance": 0.016088024080376198,
                                                "speed": 3.2587701541865037
                                            },
                                            {
                                                "distance": 0.016967719110233887,
                                                "speed": 3.2644122658168344
                                            },
                                            {
                                                "distance": 0.017210907642340793,
                                                "speed": 3.663008252833928
                                            },
                                            {
                                                "distance": 0.016538921110887915,
                                                "speed": 3.4210931015108925
                                            },
                                            {
                                                "distance": 0.01639579551182085,
                                                "speed": 3.395330493678821
                                            },
                                            {
                                                "distance": 0.01673262698106198,
                                                "speed": 3.376613251898584
                                            },
                                            {
                                                "distance": 0.017236276548402447,
                                                "speed": 3.581797419327908
                                            },
                                            {
                                                "distance": 0.016919605854158977,
                                                "speed": 3.8097802953742326
                                            },
                                            {
                                                "distance": 0.017126662916206358,
                                                "speed": 4.178513234272858
                                            },
                                            {
                                                "distance": 0.016829586929632136,
                                                "speed": 4.071565879106137
                                            },
                                            {
                                                "distance": 0.0191734633903177,
                                                "speed": 4.9153614049529395
                                            },
                                            {
                                                "distance": 0.02208465761386899,
                                                "speed": 6.274439424549843
                                            },
                                            {
                                                "distance": 0.03024859893360211,
                                                "speed": 9.213458299653766
                                            },
                                            {
                                                "distance": 0.03620518096804347,
                                                "speed": 11.357827832052655
                                            },
                                            {
                                                "distance": 0.039338988265846454,
                                                "speed": 12.840820546310326
                                            },
                                            {
                                                "distance": 0.04648751645592168,
                                                "speed": 15.946523857539958
                                            },
                                            {
                                                "distance": 0.05166829979460892,
                                                "speed": 18.093141523768715
                                            },
                                            {
                                                "distance": 0.05421986459391126,
                                                "speed": 19.519151253808054
                                            },
                                            {
                                                "distance": 0.057580151944501334,
                                                "speed": 20.72885470002048
                                            },
                                            {
                                                "distance": 0.062413841155498695,
                                                "speed": 22.468982815979526
                                            },
                                            {
                                                "distance": 0.08604352522384662,
                                                "speed": 22.929095932301315
                                            },
                                            {
                                                "distance": 0.08811837627699817,
                                                "speed": 23.67604231143587
                                            },
                                            {
                                                "distance": 0.1309328682160053,
                                                "speed": 20.642278691134383
                                            },
                                            {
                                                "distance": 0.13761767129560795,
                                                "speed": 23.048807799791337
                                            },
                                            {
                                                "distance": 0.14076944654244106,
                                                "speed": 24.183446888651254
                                            },
                                            {
                                                "distance": 0.13856180774948113,
                                                "speed": 23.388696923185677
                                            },
                                            {
                                                "distance": 0.14137539472695085,
                                                "speed": 24.40158823507478
                                            },
                                            {
                                                "distance": 0.1433676032315263,
                                                "speed": 25.118783296721944
                                            },
                                            {
                                                "distance": 0.1431961374097788,
                                                "speed": 25.05705560089284
                                            },
                                            {
                                                "distance": 0.14077142954338107,
                                                "speed": 24.184160768989663
                                            },
                                            {
                                                "distance": 0.11500995650565878,
                                                "speed": 22.956603623693102
                                            },
                                            {
                                                "distance": 0.11056416396778508,
                                                "speed": 20.947824717950887
                                            },
                                            {
                                                "distance": 0.060583721969413376,
                                                "speed": 21.401846316881127
                                            },
                                            {
                                                "distance": 0.04906520542748074,
                                                "speed": 17.25518036178537
                                            },
                                            {
                                                "distance": 0.04394975645537138,
                                                "speed": 15.413618731826002
                                            },
                                            {
                                                "distance": 0.03999460124755574,
                                                "speed": 13.98976285701238
                                            },
                                            {
                                                "distance": 0.032550488929837744,
                                                "speed": 11.309882422633901
                                            },
                                            {
                                                "distance": 0.02891071658962876,
                                                "speed": 9.999564380158668
                                            },
                                            {
                                                "distance": 0.02451669826955255,
                                                "speed": 8.41771778493123
                                            },
                                            {
                                                "distance": 0.02186450970202033,
                                                "speed": 7.462929900619632
                                            },
                                            {
                                                "distance": 0.022645513876374743,
                                                "speed": 7.744091403387221
                                            },
                                            {
                                                "distance": 0.022105243049451162,
                                                "speed": 7.957887497802417
                                            },
                                            {
                                                "distance": 0.02019645562765049,
                                                "speed": 7.270724025954178
                                            },
                                            {
                                                "distance": 0.02033958157471002,
                                                "speed": 7.3222493668956075
                                            },
                                            {
                                                "distance": 0.01916943150896164,
                                                "speed": 6.900995343226191
                                            },
                                            {
                                                "distance": 0.017484988331223347,
                                                "speed": 6.294595799240406
                                            },
                                            {
                                                "distance": 0.017638939504009014,
                                                "speed": 6.350018221443244
                                            },
                                            {
                                                "distance": 0.016734922514389506,
                                                "speed": 6.024572105180221
                                            },
                                            {
                                                "distance": 0.01821300389420598,
                                                "speed": 6.55668140191415
                                            },
                                            {
                                                "distance": 0.018915993983913575,
                                                "speed": 6.809757834208888
                                            },
                                            {
                                                "distance": 0.019675414683410216,
                                                "speed": 7.083149286027679
                                            },
                                            {
                                                "distance": 0.020904354562421484,
                                                "speed": 7.525567642471735
                                            },
                                            {
                                                "distance": 0.022388967001599782,
                                                "speed": 8.060028120575922
                                            },
                                            {
                                                "distance": 0.02281967241291837,
                                                "speed": 8.215082068650613
                                            },
                                            {
                                                "distance": 0.023393504984937592,
                                                "speed": 8.421661794577535
                                            },
                                            {
                                                "distance": 0.023817679967559964,
                                                "speed": 8.574364788321587
                                            },
                                            {
                                                "distance": 0.023980399763457755,
                                                "speed": 8.632943914844791
                                            },
                                            {
                                                "distance": 0.023707494450351377,
                                                "speed": 8.534698002126495
                                            },
                                            {
                                                "distance": 0.0246705364665096,
                                                "speed": 8.881393127943458
                                            },
                                            {
                                                "distance": 0.023803582142762687,
                                                "speed": 8.569289571394567
                                            },
                                            {
                                                "distance": 0.02272303203501301,
                                                "speed": 8.180291532604684
                                            },
                                            {
                                                "distance": 0.021400445232121874,
                                                "speed": 7.7041602835638745
                                            },
                                            {
                                                "distance": 0.020583418884407317,
                                                "speed": 7.410030798386634
                                            },
                                            {
                                                "distance": 0.01987980727579379,
                                                "speed": 7.1567306192857645
                                            },
                                            {
                                                "distance": 0.019305971898456894,
                                                "speed": 6.95014988344448
                                            },
                                            {
                                                "distance": 0.019093884407145708,
                                                "speed": 6.873798386572453
                                            },
                                            {
                                                "distance": 0.018931162156051607,
                                                "speed": 6.81521837617858
                                            },
                                            {
                                                "distance": 0.019690584021537588,
                                                "speed": 7.0886102477535315
                                            },
                                            {
                                                "distance": 0.018521985573430006,
                                                "speed": 6.667914806434803
                                            },
                                            {
                                                "distance": 0.019078797609311318,
                                                "speed": 6.868367139352076
                                            },
                                            {
                                                "distance": 0.019672826198353206,
                                                "speed": 7.0822174314071535
                                            },
                                            {
                                                "distance": 0.019523058654403364,
                                                "speed": 7.028301115585211
                                            },
                                            {
                                                "distance": 0.01885547256293962,
                                                "speed": 6.787970122658264
                                            }
                                        ]
                                    },
                                    "plotConfig": {
                                        "chartType": "line",
                                        "height": "100%",
                                        "legend": {
                                            "show": true
                                        },
                                        "width": "100%",
                                        "y": {
                                            "max": 49.89,
                                            "min": 0.01
                                        },
                                        "y2": {}
                                    }
                                },
                                "displayType": "chart"
                            }
                        ]
                    }
                ]
            }
        ],
        "id": "48e468c0-a758-11e9-8194-df826e3e75d6",
        "language": "javascript"
    },
    "version": 1
};