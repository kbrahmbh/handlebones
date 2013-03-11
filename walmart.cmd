
setlocal

set root=.\

 copy /B^
 %root%\css\reset.css^
+%root%\css\index.css^
 index.css

copy /B^
 %root%\templates\search.handlebars.js^
+%root%\templates\breadcrumbs.handlebars.js^
+%root%\templates\filter.handlebars.js^
+%root%\templates\slider.handlebars.js^
+%root%\templates\reset.handlebars.js^
+%root%\templates\items.handlebars.js^
+%root%\templates\item.handlebars.js^
 %root%\scripts\templates.js

copy /B^
 %root%\scripts\jquery.js^
+%root%\scripts\underscore.js^
+%root%\scripts\handlebars.js^
+%root%\scripts\backbone.js^
+%root%\scripts\templates.js^
+%root%\scripts\application.js^
 index.js

endlocal
