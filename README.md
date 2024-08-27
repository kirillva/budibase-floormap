# Плагин для рисования floormap
Данный плагин для low-code платформы budibase позволяет рисовать с помощью библиотеки d3 план здания с геозонами, метками

# Развитие
Необходимо добавить отрисовку координат пользователей.

# Отладка
Сборка происходит здесь: rollup.config.js

Можно закомментировать сокращение текста, тогда debugger не будут затираться в map-1.0.0.tar.gz и будет срабатывать точка останова в коде плагина.
// import { terser } from "rollup-plugin-terser"
// terser

## Instructions

To build your new  plugin run the following in your Budibase CLI:
```
budi plugins --build
```

You can also re-build everytime you make a change to your plugin with the command:
```
budi plugins --watch
```

