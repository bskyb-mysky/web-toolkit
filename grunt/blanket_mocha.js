module.exports = {
    all : ['_site/test.html'],
    options : {
        reporter: 'Spec',
        threshold : 76, // <- each file has to have this much coverage
        globalThreshold : 82, // <- average coverage
        // the below is temporary, there is an issue on GitHub to get them up to 75
        customThreshold: {
            'src/js/toolkit/components/tooltip.js': 41,
            'src/js/toolkit/utils/polyfill.js': 67,
            'src/js/toolkit/utils/skycons.js': 54,
            'src/js/toolkit/utils/validation.js': 44
        },
        log : true,
        logErrors: true // outputs Phantom JS errors
    }
};
