
/**
 purpose:
 to let 'anchor' tags do their job and change the hash in the url for internal links.
 this will execute the associated callback with that hash.
 no onclick events needed.
 **/
if (typeof toolkit==='undefined') toolkit={};
toolkit.hashmanager = (function() {

    var vars = {
        globalHashList: {},
        hasLoaded: false,
        windowLoaded: false
    };

    function bindEvents() {
        $(window).on('hashchange', onHashChange);
        var hashChangeSupport = 'onhashchange' in window;
        if (!hashChangeSupport){ //IE7 support
            vars.hash = document.location.hash;
            setInterval(function(){
                if (document.location.hash !== vars.hash){
                    onHashChange(document.location.hash);
                }
            },200);
        }
        vars.windowLoaded = true;
    }

    function onHashChange(hash) {
        hash = cleanHash((typeof hash === 'string') ? hash : location.hash);
        var evt = vars.globalHashList[hash];
        if (!evt) { return; }
        evt.callback(hash);
    }

    function remove() {
        var loc = window.location;
        if ("pushState" in history) {
            location.hash = '!';
            history.pushState("", document.title, loc.pathname + loc.search);
        } else {
            location.hash = '!';
        }
    }

    function change(hash){
        location.hash = '!' + hash;
    }

    function register(hashList, callback){
        var globalHashList = vars.globalHashList;
        $(hashList).each(function(i, hash) {
            hash = cleanHash(hash);
            if (globalHashList[hash]){
                var err = 'hashManager: hash (' + hash + ') already exists';
                throw new Error(err);
            }
            globalHashList[hash] = {
                callback: callback
            };

            if (vars.windowLoaded && hash === cleanHash(location.hash)) {
                callback(hash);
            }
        });
    }

    function cleanHash(hash) {
        return hash.replace(/[#!]/g, '');
    }

    bindEvents();

    return {
        register: register,
        change: change,
        remove: remove,
        onHashChange: onHashChange,
        cleanHash: cleanHash
    };
}());

if (typeof define === "function" && define.amd) {
    define('utils/hashmanager', [], function() {
        return toolkit.hashmanager;
    });
};
/**
 purpose:
 to automatically hook into the bootstrap html and shows/hides tabs.
 Works based registering the tabs 'hash' with the changeTab function.
 no onclick events needed.
**/
if (typeof toolkit==='undefined') toolkit={};
toolkit.tabs = (function(hash) {

    var $el = {
        tabContainer: $('section[data-function=tabs]'),
        tabs: $('section[data-function=tabs] li[role=tab]'),
        tabTargets: $('section[data-function=tabs] div[role=tabpanel]')
    };
    var vars = {
        rememberState : $el.tabContainer.attr('data-remember-state')==='true'
    };

    function bindEvents() {
        if (vars.rememberState){
            hash.register(getHashList(), changeTab);
        } else {
            $el.tabs.on('click', function(e){
                e.preventDefault();
                changeTab($(this).find('a').attr('href'));
            });
        }
    }

    function getHashList() {
        var arrHash = [];
        $el.tabs.each(function(){
            arrHash.push($(this).attr('aria-controls'));
        });
        return arrHash;
    }

    function changeTab(controlId){
        $el.tabTargets.add($el.tabs).removeClass("selected");
        $('#' + controlId + '-tab').add($(controlId))
            .addClass('selected');
    }

    bindEvents();

    return {
        getHashList: getHashList,
        changeTab: changeTab
    };

}(toolkit.hashmanager));


if (typeof window.define === "function" && window.define.amd) {
    define('modules/tabs', ['utils/hashmanager'], function() {
        return toolkit.tabs;
    });
};
(function(window, $) {
    

    // get CSS3 capabilities
    var has3d = (function() {
        return ('WebKitCSSMatrix' in window && 'm11' in new window.WebKitCSSMatrix());
    }());
    var hasTransform = (function() {
        var s = document.body.style;
        return s.transform !== undefined || s.WebkitTransform !== undefined || s.MozTransform !== undefined || s.OTransform !== undefined;
    }());
    var clickEvent = 'ontouchend' in document.documentElement ? 'touchend' : 'click';

    function Carousel(element, options) {
        this.options = options;
        this.$viewport = element;
        this.$slideContainer = element.find('.skycom-carousel-container');
        this.$slides = this.$slideContainer.find('>');
        this.currentIndex = 0;
        this.slideCount = this.$slides.length;
        this.timerId = false;
        this.touchReset();
        this.bindEvents();
    }

    Carousel.prototype = {
        unbindTouchEvents: function() {
            this.$slideContainer.off('touchstart touchmove touchend touchcancel');
        },
        bindTouchEvents: function() {
            this.$slideContainer
                .on('touchstart', this.touchstart.bind(this))
                .on('touchmove', this.touchmove.bind(this))
                .on('touchend', this.touchend.bind(this))
                .on('touchcancel', this.touchReset.bind(this));
        },
        bindEvents: function() {
            this.bindTouchEvents();
            this.$slideContainer.find('a').on('click', this.pause.bind(this));
        },
        unbindEvents: function() {
            this.unbindTouchEvents();
            this.$slideContainer.find('a').off('click');
        },
        setOffset: function(percent, animate) {
            var $container = this.$slideContainer.removeClass("animate");
            if (animate) $container.addClass("animate");
            if (has3d) {
                $container.css("transform", "translate3d("+ percent +"%,0,0) scale3d(1,1,1)");
            } else if (hasTransform) {
                $container.css("transform", "translate("+ percent +"%,0)");
            } else if (animate) {
                $container.animate({'left': (percent*2) + '%'}, 600);
            } else {
                $container.css({'left': (percent*2) + '%'});
            }
            return this;
        },
        moveSlide : function(opts){//index, start, end, callback, reverse
            var self = this,
                $slides = this.$slides,
                cssFloat, indexToShow;

            indexToShow = (opts.index >= this.slideCount)?0:(opts.index < 0) ? this.slideCount - 1 : opts.index;
            cssFloat = (opts.index>this.currentIndex && !opts.reverse) ? 'left' : 'right';

            $slides.filter(':not(:eq(' + this.currentIndex + '))').hide();
            $slides.eq(this.currentIndex).css('float', cssFloat);
            $slides.eq(indexToShow).show().css('float', cssFloat == 'left' ? 'right' : 'left');

            this.setOffset(opts.start, false);
            if (typeof opts.end !== 'undefined'){
                setTimeout(function(){
                    self.setOffset(opts.end, true);
                    self.$viewport.trigger('change', indexToShow);
                }, 20);
                this.currentIndex = indexToShow;
                if (typeof opts.callback == 'function') opts.callback(indexToShow);
            }
            return indexToShow;
        },
        goto: function(slideIndex, pause, callback) {
            if (pause !== false) this.pause();
            if (slideIndex===this.currentIndex) { return; }

            if ((slideIndex>this.currentIndex)) {
                this.moveSlide({index: slideIndex, start:0, end:-50, callback:callback});
            } else{
                this.moveSlide({index: slideIndex, start:-50, end: 0, callback:callback});
            }
            return this;
        },
        next: function(pause, callback) {
            this.goto(this.currentIndex + 1, pause, callback);
            this.$viewport.find('.indicators, .actions').css('display', 'block');
            return this;
        },
        previous: function() {
            this.goto(this.currentIndex - 1);
            this.$viewport.find('.indicators, .actions').css('display', 'block');
            return this;
        },
        play: function(callback, delay) {
            var self = this,
                interval = this.options.interval;
            self.timerId = setTimeout(function() { //timeout for small delay after pressing pay button
                self.next(false);
                self.timerId = setTimeout(function loop() {  //timeout interval between slides
                    self.next(false, function() {
                        self.timerId = setTimeout(loop, interval);
                    });
                }, interval);
            }, delay || this.options.onPlayDelay);

            this.$viewport.trigger('playing');
            if (typeof callback == 'function') callback();
            return this;
        },
        pause: function(callback) {
            clearTimeout(this.timerId);

            this.$viewport.trigger('paused');
            if (typeof callback == 'function') callback();
            return this;
        },
        touchstart: function(e) {
            var touch = e.originalEvent.touches[0];
            this.pause();
            this.swipe.start = {x: touch.pageX, y:touch.pageY};
        },
        touchmove: function(e) {
            var swipe = this.swipe,
                touch = e.originalEvent.touches[0],
                xDifference = touch.pageX - swipe.start.x,
                yDifference = touch.pageY - swipe.start.y,
                scrollingCarousel = Math.abs(xDifference) > Math.abs(yDifference),
                slideIndex = xDifference<0?this.currentIndex+1:this.currentIndex- 1,
                positionAsPercentage;

            if (!swipe.start || scrollingCarousel===false) return;
            e.preventDefault();

            positionAsPercentage = (xDifference / this.$slideContainer.outerWidth(true)) * 100;
            if (xDifference>0) positionAsPercentage -=50;
            this.swipe.positionAsPercentage = positionAsPercentage;

            this.moveSlide({index:slideIndex,start:positionAsPercentage});
        },
        touchend: function(e) {
            if (!this.swipe.start) return;
            var swipe = this.swipe,
                position = swipe.positionAsPercentage,
                touch = e.originalEvent.changedTouches[0],
                xDifference = touch.pageX - swipe.start.x,
                direction = null,
                threshold = 75;
            if (Math.abs(xDifference) > threshold) {
                direction = (xDifference < 0) ? 'left' : 'right';
            }

            if (direction === 'left') {
                this.moveSlide({
                    index: this.currentIndex + 1,
                    start: position,
                    end: -50
                });
            } else if (direction === 'right') {
                this.moveSlide({
                    index: this.currentIndex - 1,
                    start: position,
                    end:0
                });
            } else if (position !== 0) {
                var start = (xDifference > 0) ? position + 50 : position,
                    index = this.currentIndex,
                    end = 0,
                    reverse;
                if (start < 0){
                    this.currentIndex = (index+1>=this.slideCount) ? 0 : index+1;
                } else {
                    this.currentIndex -= 1;
                    end = -50;
                    start -= 50;
                }
                reverse = this.currentIndex===0 && index === this.slideCount-1;
                this.moveSlide({
                    index: index,
                    start: start,
                    end: end,
                    reverse: reverse
                });
            }
            this.touchReset();
        },
        touchReset: function() {
            this.swipe = {
                start: false,
                positionAsPercentage: 0
            };
        }
    };

    function Video($wrapper, carousel, options) {
        this.carousel = carousel;
        this.wrapper = $wrapper;
        this.videoId = this.wrapper.data('video-id');
        this.player = this.wrapper.find('video');
        this.player.sky_html5player($.extend(true, {
            videoId: this.videoId
        }, options.player));
        this.videocontrolcontainer = this.wrapper.find('.videocontrolcontainer');
        this.videocontrolcontainer.find('img').on('error', function() {
            this.src = options.placeHolderImage;
        });
        this.bindEvents();
    }

    Video.prototype = {
        bindEvents: function(){
            var $self = this,
                hijackLink = function() {
                  return false;
                },
                stop = function(e){
                    $self.stop();
                    $wrapper.off('click', hijackLink);
                    return false;
                },
                $wrapper = this.wrapper;
            $wrapper.on('click', hijackLink).find('.close').one(clickEvent, stop);
            this.player.on('ended webkitendfullscreen', stop);
        },
        play: function() {
            var $self = this,
                carouselControls = this.carousel.$viewport.find('.actions, .indicators');
            this.originalHtml = this.videocontrolcontainer.html();
            this.carousel.pause();
            this.showCanvas(function() {
                carouselControls.hide();
                $self.carousel.unbindTouchEvents();
                $self.videocontrolcontainer.add($self.player).show();
                sky.html5player.play($self.wrapper);
            });
        },
        stop: function() {
            var $self = this,
                carouselControls = this.carousel.$viewport.find('.actions, .indicators');
            sky.html5player.close(this.wrapper);

            this.hideCanvas( function(){
                $self.carousel.bindTouchEvents();
                $self.videocontrolcontainer.hide().remove();
                carouselControls.show();
                $('<div></div>').addClass('videocontrolcontainer').html($self.originalHtml).appendTo($self.wrapper);
            });
        },
        showCanvas: function(callback) {
            var height,
                $carousel = this.carousel.$viewport,
                $overlay = $carousel.find('.video-overlay'),
                $wrapper = $carousel.find('.video-wrapper'),
                $play = $carousel.find('.video-wrapper .play'),
                $close = $carousel.find('.video-wrapper .close'),
                speed= 500;
            this.originalHeight = $carousel.height();
            $wrapper.addClass('playing-video');
            $overlay.fadeIn(function() {
                $play.fadeOut();
                height = Math.round(($carousel.width() / 16) * 9);
                $carousel.animate({ height: height }, speed, function() {
                    callback();
                    $overlay.fadeOut(speed, function() {
                        $close.addClass('active');
                    });
                });
            });
        },
        hideCanvas: function(callback) {
            var $carousel = this.carousel.$viewport,
                $overlay = $carousel.find('.video-overlay'),
                $wrapper = $carousel.find('.video-wrapper'),
                $play = $carousel.find('.video-wrapper .play'),
                $close = $carousel.find('.video-wrapper .close'),
                speed = 500,
                originalHeight = this.originalHeight;
            $overlay.fadeIn(speed, function() {
                $close.removeClass('active');
                $('.skycom-carousel').animate({ height: originalHeight }, speed, function(){
                    $('.skycom-carousel').css({ height: 'auto' });
                    callback();
                    $play.fadeIn();
                    $overlay.fadeOut();
                    $wrapper.removeClass('playing-video');
                });
            });
        }
    };

    // jquerify
    $.fn.skycom_carousel = function(params) {
        var options = $.extend(true, {
            carousel: {

                actions: [
                    { id: 'previous', label: 'Previous' },
                    { id: 'next', label: 'Next' },
                    { id: 'play', label: 'Play Carousel' },
                    { id: 'pause', label: 'Pause Carousel' }
                ],
                autoplay: true,
                onPlayDelay: 500,
                interval: 6000
            },
            video: {
                player: {
                    token:"8D5B12D4-E1E6-48E8-AF24-F7B13050EE85",
                    autoplay: false
                },
                placeHolderImage: '//static.video.sky.com/posterframes/skychasky.jpg',
                autoplay: !globalskycom.browserSupport.isMobile()
            }
        }, params);

        // generating default markup
        var markup = {
            actions: function($element, options){

                var html = '', action, label, i, extraClass,
                    actions = options.actions,
                    onclick = options.onclick;
                if(options.count <= 1) return this;
                for (i in actions) {
                    extraClass = '';
                    action = actions[i].id;
                    label = actions[i].label;
                    if (action=='next' || action=='previous'){
                        extraClass=' hidden-touch ';
                    }
                    html += '<a href="#" class="skycom-internal ' + extraClass + action + '" >';
                    html += '<span class="icon-carousel-' + action + '"></span>' + label;
                    if (action == 'next' || action == 'previous') {
                        html += '<span class="icon-carousel-' + action + '-over over"></span>';
                    }
                    html += '</a>';
                }
                $element.prepend('<div class="actions">' + html + '</div>').find('> .actions > *').each(function(index) {
                    $(this).attr('data-action', actions[index].id).on('click', function(e) {
                        onclick(actions[index].id);
                        e.preventDefault();
                    });
                });
                return this;
            },
            indicators: function($element, options) {

                var $indicators, i,
                    count = options.count,
                    onclick = options.onclick,
                    html = '<div class="indicators"><div class="container">',
                    className = ' class="active"';
                if (count <= 1) return this;
                for (i = count; i--;) {
                    html += '<span' + className + ' data-track data-tracking-label="indicator"></span>';
                    className = '';
                }
                $indicators = $(html + '</div></div>').on('click', 'span', function(e) {
                    onclick($(e.currentTarget).index());
                });
                $element.append($indicators);
                return this;
            },
            video: function($element) {
                $element.append('<div class="video-overlay"></div>');
                return this;
            }
        };

        return this.each(function() {
            var $this = $(this);
            var carousel = new Carousel($this, options.carousel);

            markup.indicators($this, {
                count: carousel.slideCount,
                onclick: function(index) {
                    carousel.goto(index);
                }
            }).actions($this, {
                count: carousel.slideCount,
                actions: options.carousel.actions,
                onclick: function(action) {
                    carousel[action]();
                }
            }).video($this);

            $this.on('click', '.video-wrapper .play', function(e) {
                var video = new Video($(this).closest('.video-wrapper'), carousel, options.video);
                video.play();
                return false;
            }).on('change',function(e, index) {
                index = index || 0;
                $this.find('.indicators .container > *').removeClass('active').eq(index).addClass('active');
                carousel.$slides.removeClass('active').find('a').attr('tabindex',-1);
                carousel.$slides.eq(index).addClass('active').find('a').removeAttr('tabindex');
            }).on('playing',function() {
                $this.removeClass('paused').addClass('playing');
            }).on('paused',function() {
                $this.removeClass('playing').addClass('paused');
            }).on('pause',function() {
                carousel.pause();
            }).on('play',function() {
                carousel.play();
            }).on('keyup',function(e){
                switch(e.keyCode){
                    case 9: carousel.pause(); break; //tab
                    case 37: carousel.previous(); break; //left arrow
                    case 39: carousel.next(); break; //right arrow
                }
            }).find('.toggle-terms').on('click', function(e) {
                carousel.$viewport.toggleClass('showing-tandcs');
            });

            // must specify interval to override default onPlayDelay interval
            carousel[options.carousel.autoplay === true ? 'play' : 'pause'](false, options.carousel.interval);
            $this.trigger('change');
        });
    };
}(window, jQuery));

define("modules/carousel", function(){});

require(['modules/tabs',
        'modules/carousel']);
define("toolkit", function(){});

//# sourceMappingURL=toolkit.js.map