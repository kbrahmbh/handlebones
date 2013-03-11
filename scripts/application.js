
window.Application = {View:{}};

$(function() {
    
    $.getJSON('televisions.json',null,function(items) {

        items.types = {},items.brands = {};items.sizes = {};
        items.forEach(function(item) {

            items.types[item.type] = item.type;
            items.brands[item.brand] = item.brand;
            items.sizes[item.size] = item.size;
            
            item.descrip = item.description.split(/<li>/i).slice(1).join(', ');
            
            item.dollars = Math.floor(item.price);
            item.cents = Math.floor(100 + Math.round(100*(item.price - item.dollars))).toString().substring(1);
            
            item.stars = Math.floor(Math.max(0,(Math.min(5,parseFloat(item.rating)))*20)).toString().concat('px');

        });
        
        items.types = Object.keys(items.types).sort();
        items.brands = Object.keys(items.brands).sort();
        items.sizes = Object.keys(items.sizes).sort(function(a,b) { return parseInt(a) - parseInt(b); });
        
        var update = _.extend({},Backbone.Events);
        
        // Search
    
        Application.View['search'] = Backbone.View.extend({
          
            className : 'gh-srch',
          
            events: {
                'submit form' : 'submit'
            },
            
            render: function() {
                var context = this.model.attributes;
                this.$el.html(this.options.template(context));
                this.value = $('input',this.$el).val();
            },

            submit : function(event) {
                event.preventDefault();
                this.value = $('input',this.$el).val();
                update.trigger('update');
            },
            
            reset : function() {
                this.value = $('input',this.$el).val('');
            }
    
        });
    
        var model = new Backbone.Model({
        });
    
        update.search = new Application.View['search']({ template: Handlebars.templates['search'], model: model });
        update.search.render();
    
        $('.gh-srch').replaceWith(update.search.el);
    
        // Breadcrumbs
    
        var BreadcrumbsView = Application.View['breadcrumbs'] = Backbone.View.extend({
          
          className : 'gh-crumbs',
          
          render: function() {
            var context = this.model.attributes;
            var output = this.options.template(context);
            this.$el.html(output);
          }
        });
    
        var model = new Backbone.Model({
            home: 'http://www.walmart.com',
            crumbs: [
                { name:'DEPARTMENTS', href:'http://www.walmart.com/cp/All-Departments/121828'},
                { name:'ELECTRONICS', href:'http://www.walmart.com/cp/Electronics/3944?povid=P1171-C1110.877+1455.1724+1115.950-L2'},
                { name:'TV\'S', href:'http://www.walmart.com/cp/1060825?povid=cat1070145-env172199-moduleA080112-lLinkGNAV_Electronics_Electronics_TV_Video'},
    
            ]
        });
    
        var view = new Application.View['breadcrumbs']({ template: Handlebars.templates['breadcrumbs'], model: model });
        view.render();
    
        $('.gh-crumbs').replaceWith(view.el);
    
        // Slider
    
        var SliderHandle = Application.View['SliderHandle']  = Backbone.View.extend({
    
            initialize: function() {
    
                var self = this,context = self.model;
    
                self.$el = $('<div class="hdl"/>').appendTo(context.target);
                self.$el.toggleClass('ds',context.disabled || false);
        
                self.ondragstop = self.onDragStop.bind(self);
                self.ondragmove =  self.onDragMove.bind(self);
        
                self.$el.bind('click',self.onCancel.bind(self));
                self.$el.bind('dragstart',self.onCancel.bind(self));
        
                self.$el.bind('mousedown',self.onDragStart.bind(self));
    
            },
    
            detached:true,
            
            move : function(position) {
                var self = this,parent = self.$el.parent(),target = self.$el,half = Math.floor(self.$el.width()/2);
                target.css({left:Math.round((self.position = Math.min(Math.max(0,position),parent.width()))) - half});
                return position;
            },
            
            onCancel : function(event) {
                return false;
            },
            
            onDragStart : function(event) {
            
                var self = this,disabled = self.disabled;
                if (disabled) return false;
            
                var offset = self.$el.position();
                self.eventLeft = event.clientX - offset.left;;
                self.$el.toggleClass('drag');
            
                $(document).bind('mouseup',self.ondragstop);
                $(document).bind('mousemove',self.ondragmove);
            
                self.disableSelect($(document.body));
            
            },
            
            onDragMove : function(event) {
                var self = this,half = Math.floor(self.$el.width()/2);
                self.move(self.model.onDrag(event.clientX - self.eventLeft + half));
                return false;
            },
            
            onDragStop : function(event) {
            
                var self = this,onStop = self.model.onStop;
                if (onStop) self.move(onStop(self.position));
                self.$el.toggleClass('drag');
            
                $(document).unbind('mouseup',self.ondragstop);
                $(document).unbind('mousemove',self.ondragmove);
            
                self.enableSelect($(document.body));
            
            },
    
    		//> public void disableSelect(Object elem)
    		disableSelect: function(elem) {
    
    			if (document.all) {
    				elem.bind('dragstart selectstart',this.cancelSelect.bind(this));
    			}
    			else {
    				elem.css({'-webkit-user-select':'none','-moz-user-select':'none','user-select':'none'});
    			}
    
    		},
    
    		//> public void enableSelect(Object elem)
    		enableSelect: function(elem) {
    
    			if (document.all) {
    				elem.unbind('dragstart selectstart');
    			}
    			else {
    				elem.css({'-webkit-user-select':'','-moz-user-select':'','user-select':''});
    			}
    
    		},
    
    		cancelSelect : function(event) {
    			return false;
    		}
    
        });
    
        Application.View['slider']  = Backbone.View.extend({
    
            className : 'slider',
            
            render : function(target) {
    
                var self = this,context = self.model ? self.model.attributes : {};
                target.replaceWith(self.$el.html(self.options.template(context)));
    
                var disabled = context.disabled || false;
        
                self.range = $('.range',self.$el);
                self.bar = $('.bar',self.range).toggleClass('ds',disabled);
                self.range.bind('click',self.onClick.bind(self));
        
                self.left = new SliderHandle({model:{onDrag:self.onMinDrag.bind(self),onStop:self.onMinStop.bind(self),target:self.range,disabled:disabled}});
                self.left.bubble = $('<div class="bubble"><div class="text"></div><div class="tip"></div></div>').appendTo(self.left.$el);

                self.right = new SliderHandle({model:{onDrag:self.onMaxDrag.bind(self),onStop:self.onMaxStop.bind(self),target:self.range,disabled:disabled}});
                self.right.bubble = $('<div class="bubble"><div class="text"></div><div class="tip"></div></div>').appendTo(self.right.$el);

                self.label  = $('.label',self.$el);
                
                self.min = context.min;self.max = context.max;
                self.low = context.low;self.high = context.high;
                
                if (self.range.width()) self.layout();
        
            },
            
            layout : function(force) {
    
                var self = this;
    
                self.low = Math.max(self.low,self.min);
                self.high = Math.min(self.high,self.max);
    
                var left = self.position(self.low);self.left.move(left);
                var right = self.position(self.high);self.right.move(right);
    
                $('.text',self.left.bubble).text(self.format(self.low));
                self.left.bubble.css({left:-Math.round(self.left.bubble.width()/2)});

                $('.text',self.right.bubble).text(self.format(self.high));
                self.right.bubble.css({left:-Math.round(self.right.bubble.width()/2)});

                self.bar.css({'margin-left':Math.round(left),'margin-right':Math.round(self.range.width() - right)});
    
            },
    
            scale : function(position) {
                var self = this,range = self.range.width(),fraction = position/range;
                return Math.round(self.min + fraction*(self.max - self.min));
            },
    
            position : function(value) {
                var self = this,range = self.range.width();
                return range*((value - self.min)/(self.max - self.min));
            },
    
            format : function(value) {
                return value.toString() + '"';
            },
    
            onClick : function(event) {
    
                var self = this,offset = self.range.offset();
                var position = event.pageX - offset.left;
    
                var left = self.left.position,right = self.right.position;
                if (position < left) self.onMinStop(self.left.move(position));
                else if (position > right) self.onMaxStop(self.right.move(position));
                else if ((position - left) < (right - position)) self.onMinStop(self.left.move(position));
                else self.onMaxStop(self.right.move(position));
    
            },
    
            onMinDrag : function(offset) {
    
                var self = this,range = self.range.width();
                var position = Math.min(Math.max(0,offset),self.right.position);
                self.left.$el.css({'z-index':1});self.right.$el.css({'z-index':0});

                $('.text',self.left.bubble).text(self.format(self.low = self.scale(position)));
                self.left.bubble.css({left:-Math.round(self.left.bubble.width()/2)});
                        
                self.bar.css({'margin-left':Math.round(position)});
    
                return position;
    
            },
    
            onMaxDrag : function(offset) {
    
                var self = this,range = self.range.width();
                var position = Math.min(Math.max(self.left.position,offset),range);
                self.left.$el.css({'z-index':0});self.right.$el.css({'z-index':1});

                $('.text',self.right.bubble).text(self.format(self.high = self.scale(position)));
                self.right.bubble.css({left:-Math.round(self.right.bubble.width()/2)});

                self.bar.css({'margin-right':Math.round(range - position)});
    
                return position;
    
            },
    
            onMinStop : function(offset) {
                var self = this,position = self.onMinDrag(offset);
                //self.publish('slider',{slider:'low',value:self.scale(position)});
                update.trigger('update');
                return position;
    
            },
    
            onMaxStop : function(offset) {
                var self = this,position = self.onMaxDrag(offset);
                //self.publish('slider',{slider:'high',value:self.scale(position)});
                update.trigger('update');
                return position;
            },
    
            reset : function() {
                var self = this,context = this.model.attributes;
                self.min = context.min;self.max = context.max;
                self.low = context.low;self.high = context.high;
                self.layout();
            },
    
        });
    
        var min = parseInt(items.sizes[0]);
        var max = parseInt(items.sizes[items.sizes.length - 1]);
        
        var model   = new Backbone.Model({
            label:'Size',
            min:0,max:max,low:min,high:max
        });
    
        update.slider = new Application.View['slider']({ template: Handlebars.templates['slider'], model: model });
        update.slider.render($('.slider'));
    
        // Filters
    
        var FilterView = Backbone.View.extend({
    
            className : 'filter',
    
            events: {
                'click .btn' : 'click',
                'click .opt' : 'select',
                'mouseleave .lyr' : 'mouseleave'
            },
    
            render: function() {
                var context = this.model.attributes;
                this.$el.html(this.options.template(context));
            },
    
            click : function(event) {
                this.$el.find('.lyr').css({visibility:'visible'});
            },
    
            select : function(event) {
                var context = this.model.attributes;
                this.$el.find('.btn .text').text($(event.target).text());
                this.$el.find('.lyr').css({visibility:'hidden'});
                update.trigger('update',context.value = $(event.target).text());
                event.stopPropagation();
            },
            
            reset : function() {
                var context = this.model.attributes;
                this.$el.find('.btn .text').text(context.value = context.options[0].name);
            },
    
            mouseleave : function(event) {
                this.$el.find('.lyr').css({visibility:'hidden'});
                event.stopPropagation();
            }
    
        });
    
        var types = [{ name:'All Types', value:"0" }];
        items.types.forEach(function(type,index) {
            types.push({name:type,value:index + 1});
        });

        var model = new Backbone.Model({
              label:'Type',
              value:'All Types',
              options: types
        });
    
        update.type = new FilterView({ template: Handlebars.templates['filter'], model: model });
        update.type.render();
    
        $('.filters').append(update.type.el);
    
        var brands = [{ name:'All Brands', value:"0" }];
        items.brands.forEach(function(type,index) {
            brands.push({name:type,value:index + 1});
        });

        var model = new Backbone.Model({
              label:'Brand',
              value:'All Brands',
              options: brands
        });
    
        update.brand = new FilterView({ template: Handlebars.templates['filter'], model: model });
        update.brand.render();
    
        $('.filters').append(update.brand.el);
    
        var model = new Backbone.Model({
              label:'Sort',
              value:'Price',
              options: [
                { name:'Price', value:"0" },
                { name:'Rating', value:"1" },
                { name:'Size', value:"2" }
              ]
        });
    
        update.sort = new FilterView({ template: Handlebars.templates['filter'], model: model });
        update.sort.render();
    
        $('.filters').append(update.sort.el);
    
        // Reset
        
        Application.View['reset'] = Backbone.View.extend({
          
            className : 'reset',
          
            events: {
                'click .btn' : 'reset'
            },
            
            render: function() {
                var context = this.model.attributes;
                var output = this.options.template(context);
                this.$el.html(output);
            },
            
            reset : function(event) {
                event.preventDefault();
                update.trigger('reset');
            }
    
        });
    
        var model = new Backbone.Model({
        });
    
        update.reset = new Application.View['reset']({ template: Handlebars.templates['reset'], model: model });
        update.reset.render();
    
        $('.reset').replaceWith(update.reset.el);
    
        update.on('update',function() {
            
            this.items = items.slice(0);
            
            var keys = this.search.value;
            this.items = this.items.filter(function(item) {
                return (item.name.match(keys) || item.name.match(keys) || item.descrip.match(keys));
            });
            
            var low = this.slider.low;
            this.items = this.items.filter(function(item) {
                return (item.size >= low);
            });

            var high = this.slider.high;
            this.items = this.items.filter(function(item) {
                return (item.size <= high);
            });

            var type = this.type.model.get('value');
            this.items = this.items.filter(function(item) {
                return (type.match(/All Types/) || item.type.match(type));
            });
            
            var brand = this.brand.model.get('value');
            this.items = this.items.filter(function(item) {
                return (brand.match(/All Brands/) || item.brand.match(brand));
            });

            var sort = this.sort.model.get('value').toLowerCase();
            this.items.sort(function(a,b) {
                return a[sort] - b[sort];
            });
            
            var matches = this.items.length;
            var count =  matches.toString().concat((matches != 1)?' MATCHES':' MATCH');

            $('.count').text(count);
            
            var model = new Backbone.Model({items:this.items});
            var view = new ItemsView({ template: Handlebars.templates['items'], model:model});
            view.render();
        
            $('.items').replaceWith(view.el);
            
        },update);
        
        update.on('reset',function() {

            this.search.reset();
            
            this.type.reset();
            this.brand.reset();
            this.sort.reset();
            this.slider.reset();

            this.trigger('update');

        },update);
    
        // Items
    
        var ItemsView = Application.View['items'] = Backbone.View.extend({
          
        className : 'items',
        
            render: function() {
                var context = this.model.attributes;
                output = this.options.template(context);
                this.$el.html(output);
        }

        });
    
        update.trigger('update');
        
    });
    
});
