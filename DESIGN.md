---
name: NEXUS
description: Auditoría forense e investigación de incendios. Humo cálido, título carbonizado e hilo dorado.
colors:
  ceniza: "#120f0d"
  humo: "#1d1815"
  carbon: "#2a231e"
  oro: "#c9a26b"
  oro-claro: "#e0c08f"
  oro-oscuro: "#9c7a4a"
  brasa: "#ff7a2a"
  hueso: "#f4eee6"
  gris: "#b3aaa0"
  ambar-revision: "#c08419"
  sepia-timbre: "#6b4f2a"
typography:
  display:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "min(83vw / (letras × 0.42), 20svh, 15rem)"
    fontWeight: 800
    lineHeight: 0.86
    letterSpacing: "normal"
  headline:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.9rem, 6.4vw, 5.75rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "normal"
  thesis:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 3.6vw, 3.1rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  name:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 3.6vw, 3.7rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 115"
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.08rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.16em"
  button:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 700
    letterSpacing: "0.1em"
rounded:
  none: "0px"
  focus-cell: "6px"
  pill: "999px"
spacing:
  gutter-mobile: "20px"
  gutter-tablet: "32px"
  gutter-desktop: "48px"
  container: "1240px"
  section-y: "clamp(5.5rem, 11vw, 9.5rem)"
components:
  button-oro:
    backgroundColor: "{colors.oro}"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "3.3rem"
    padding: "0 36px"
  button-linea:
    backgroundColor: "{colors.ceniza}"
    textColor: "{colors.hueso}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "3.3rem"
    padding: "0 36px"
  button-linea-hover:
    backgroundColor: "{colors.hueso}"
    textColor: "{colors.ceniza}"
  placa-norma:
    backgroundColor: "{colors.humo}"
    textColor: "{colors.hueso}"
    rounded: "{rounded.none}"
    padding: "40px 36px 44px"
  hoja-informe:
    backgroundColor: "{colors.hueso}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.none}"
    padding: "32px 48px 44px"
---

# Design System: NEXUS

## Overview

**Creative North Star: "La escena después del fuego"**

El fuego es el escenario; el trabajo del investigador es el sujeto. La página vive en un humo negro y cálido, donde el título se enciende letra por letra y queda carbonizado, como queda una escena cuando el fuego ya se apagó. No hay llamas en primer plano ni rojo de alarma: la luz saturada son unas pocas brasas, y todo lo demás es ceniza, hueso y oro arena.

Bajo la hero, la página es de "el hilo": NEXUS es el nudo donde se cruzan derecho, ciencia forense e investigación de incendios, y cada conclusión queda atada a su evidencia. El hilo dorado de 1 px es lo único que conecta: dibuja la X de la intersección, recorre el método de nodo en nodo, separa el registro del perfil y toca el canto de las placas. La densidad es baja y la lectura pausada; la sobriedad viene de PRODUCT.md, porque el rubro trata pérdidas reales.

Una sola superficie rompe la oscuridad: la hoja del informe de ejemplo, papel hueso bajo una lámpara, donde las marcas de revisión se escriben solas. Se rechaza expresamente la plantilla de consultora con tarjetas de íconos y filas de cifras.

**Key Characteristics:**
- Fondo de humo cálido (ceniza y humo alternados por sección), nunca negro puro ni azul.
- Tres voces tipográficas con oficios separados: cursiva condensada para gritar, grotesca ancha para nombrar, grotesca de lectura para argumentar.
- El hilo dorado de 1 px como único conector.
- Brasas como única luz saturada; oro arena como único acento.
- Una sola superficie clara: la hoja del informe.
- Movimiento de salida exponencial: todo sube desde una máscara o desde un leve desenfoque.

## Colors

Una paleta de humo cálido con un solo acento metálico y una sola luz encendida.

### Primary
- **Oro Arena** (oro): botones principales, hilos, rótulos y la X del logo. Es el color de la marca, heredado del material entregado.
- **Oro Claro** (oro-claro): la línea acentuada de cada título de sección, las tres disciplinas del enunciado, los nodos encendidos y el anillo de foco.
- **Oro Tostado** (oro-oscuro): el lado en sombra del oro: el fondo del degradado del botón, la X del membrete y la tinta de "sustentada" en la hoja.

### Secondary
- **Brasa** (brasa): la única luz saturada. Chispas de la hero, el punto vivo de la etiqueta rotatoria, el nodo activo de Servicios y Método, el resplandor del menú móvil y el tachado de "sin sustento suficiente". Nunca rellena una superficie ni un botón.

### Tertiary (solo tinta de la hoja)
- **Ámbar de Revisión** (ambar-revision): la tinta de "requiere respaldo" en la hoja.
- **Sepia de Timbre** (sepia-timbre): el timbre en doble borde, multiplicado sobre el papel.

### Neutral
- **Ceniza** (ceniza): el suelo de la página, del html y del menú móvil.
- **Humo** (humo): el fondo alterno de sección (Servicios, Método y Contacto) y de las placas de norma. Pausa la lectura sin dibujar bordes.
- **Carbón** (carbon): la tinta de texto sobre la hoja.
- **Hueso** (hueso): el texto principal sobre lo oscuro y el papel de la hoja.
- **Gris Ceniza** (gris): texto secundario, párrafos de apoyo y rótulos de canal.

### Named Rules
**The One Ember Rule.** La brasa es la única luz saturada de la página. Aparece como punto, chispa, resplandor o trazo, nunca como relleno. Ningún otro naranja, rojo o color vivo entra al sistema.

**The Ink Stays on Paper Rule.** El ámbar de revisión y el sepia de timbre son tintas de la hoja del informe y no existen fuera de ella. La única excepción construida es la leyenda que descifra las marcas, que repite el glifo y la muestra de cada nivel junto a la hoja.

**The Single Light Surface Rule.** La hoja del informe es la única superficie clara. Cualquier otro bloque vive en ceniza o humo.

## Typography

**Display Font:** Barlow Condensed 800 cursiva (con ui-sans-serif, system-ui)
**Body Font:** Schibsted Grotesk 400 a 700 (con ui-sans-serif, system-ui)
**Name Font:** Archivo de ancho variable, 800 a 115 % de ancho

**Character:** La cursiva condensada en mayúsculas tiene la urgencia de un titular de emergencia; la Archivo ancha y recta pesa como una placa grabada; la Schibsted argumenta con la calma de un escrito jurídico.

### Hierarchy
- **Display** (800 cursiva, interlineado 0.86, mayúsculas, sin kerning; el tamaño sale del largo de la línea más larga del idioma, para que ocupe el 90 % del ancho en móvil, el 88 % desde sm con tope de 19svh y el 83 % desde lg con topes de 20svh y 15rem: en español, 12.6vw, 12.4vw y 11.6vw): el título carbonizado de la hero y el título reencendido de Contacto (clamp(3.4rem, 10vw, 9rem)). Solo estos dos llevan la textura de ceniza y la ignición.
- **Headline** (800 cursiva, clamp(2.9rem, 6.4vw, 5.75rem) o clamp(2.3rem, 4.6vw, 4rem) en tamaño medio, interlineado 0.9, mayúsculas): títulos de sección en hueso, una línea acentuada en oro claro, cada línea sube desde su máscara. También los nombres de servicio y los pasos del método, a escala de 1.75 a 2.75rem.
- **Thesis** (Schibsted 600, clamp(1.9rem, 3.6vw, 3.1rem), interlineado 1.08, tracking -0.025em, máx. 22ch): el titular de Intersección y solo él.
- **Name** (Archivo 800 al 115 %, mayúsculas, tracking 0.01em): el nombre de Domingo en la hero y en Perfil, los códigos NFPA de las placas y las entradas del registro.
- **Body** (Schibsted 400, 1.05 a 1.15rem, interlineado 1.625, 44 a 60ch): párrafos en gris; las frases que pesan suben a 1.75 a 2.65rem en 600 y hueso.
- **Label** (Schibsted 600, 0.74 a 0.8rem, tracking 0.16 a 0.18em, mayúsculas): rótulos de canal, lema del pie, firma del criterio. Siempre debajo o al lado de su dato, nunca sobre un título.

### Named Rules
**The One Thesis Rule.** El titular de Intersección va en Schibsted, la voz de lectura, a propósito: es la única frase-tesis de la página. Los demás títulos de sección usan la voz display. Si una segunda sección quiere la voz de lectura en su titular, ya no es una tesis.

**The Three Trades Rule.** Cada voz tiene un oficio. La cursiva condensada titula, la Archivo ancha nombra (personas, normas, hitos) y la Schibsted argumenta. No se cruzan.

## Layout

Un contenedor central de 1240 px con márgenes laterales de 20, 32 y 48 px (móvil, sm, lg), alineado con la barra de navegación, que llega hasta 1440 px con márgenes de 8.5vw. Cada sección tiene el mismo ritmo vertical (clamp(5.5rem, 11vw, 9.5rem) arriba y abajo) y alterna fondo ceniza y humo para pausar.

En escritorio las secciones se arman en rejillas asimétricas de dos columnas (1.1fr contra 1fr, 0.72fr contra 1fr, 0.75fr contra 2fr) con separaciones en clamp de 3 a 6.5rem; en móvil todo cae a una columna en el orden del DOM. Servicios es maestro-detalle en escritorio y acordeón en móvil. Las listas se separan con hilos, no con tarjetas: a quién sirve es una fila de cuatro columnas con divisores dorados verticales que en móvil pasan a ser horizontales.

La hero ocupa la primera pantalla y no lleva retrato (pedido de Domingo, 20-11: su foto va en Perfil, no al inicio). El título "Auditoría forense de incendios" es el protagonista: dos líneas en cursiva carbonizada, con la línea más larga a cerca del 82 % del ancho en escritorio y del 90 % en celular, y un resplandor de brasa detrás que sube mientras las letras se encienden y después parpadea apenas. Todo va en una sola columna centrada en el alto que queda bajo la barra, igual en todos los anchos: título, etiqueta rotativa, nombre (en una línea), hilo dorado, las dos frases y los dos botones. Las dos frases van en una línea separadas por un punto medio desde 1024 px, y una por línea, sin punto, en celular y tablet; el punto lo pone el componente, no los textos. Los sellos IAAI van abajo a la izquierda, alineados con el logo, desde 1024 px, y centrados entre la barra y el título hasta 1023 px. El fondo es solo humo, brasas y resplandor: se probó una escena del sitio muy atenuada detrás y competía con el título, así que no va. Título y texto comparten la velocidad de scroll, para que el parallax no los cruce. La entrada completa (sellos, título, nombre, frases y botones) queda en pantalla antes de ~1,5 s. `npm run test:portada` mide los cruces en nueve pantallas y tres idiomas.

El orden de la página: Hero, Intersección, Servicios, Perfil, Método, Resultado y Contacto, con fondos alternados desde Servicios (humo, ceniza, humo, ceniza, humo).

### Named Rules
**The Physical Pixel Rule.** Todo desplazamiento de parallax se redondea al píxel físico (Math.round(v × devicePixelRatio) / devicePixelRatio). Mover una capa en fracciones de píxel obliga a repintarla entera en cada cuadro; medido en pantalla 2x a 120 Hz, el parallax bajó de ~190 % a ~105 % de CPU.

## Elevation & Depth

La profundidad viene de capas, no de sombras. La hero apila seis planos con parallax de mouse y scroll (humo fotográfico, humo WebGL, brasas de fondo, título con su resplandor, texto, brasas en bokeh al frente) y las secciones se separan por tono (ceniza contra humo). Las sombras son luz: resplandores de brasa y la sombra cálida del botón dorado. La única sombra de objeto es la de la hoja, que se apoya sobre el escritorio oscuro.

### Shadow Vocabulary
- **Caída de la hoja** (`box-shadow: 0 1px 1px rgba(0,0,0,.3), 0 8px 16px -4px rgba(0,0,0,.4), 0 30px 60px -18px rgba(0,0,0,.6), 0 40px 70px -24px rgba(0,0,0,.45)`): solo la hoja del informe.
- **Halo del oro** (`box-shadow: 0 1px 0 rgba(255,240,210,.45) inset, 0 10px 30px -12px rgba(201,162,107,.55)`): el botón dorado en reposo; al pasar el puntero el halo se vuelve brasa.
- **Resplandor de brasa** (`box-shadow: 0 0 12px 2px rgba(255,122,42,.55)`): nodos y puntos encendidos.

### Named Rules
**The Light Not Lift Rule.** Ninguna tarjeta flota. Las sombras son brillo de oro o de brasa; la única sombra de objeto pertenece a la hoja.

## Shapes

Dos formas y nada entre ellas: la píldora completa (999 px) para todo lo que se toca (botones, enlaces de la barra, banderas, anillo de foco; la etiqueta rotatoria de la hero es la única excepción) y el ángulo recto para todo lo que se lee (placas, hoja, secciones). Los nodos del hilo son círculos de 7 a 13 px. El foco, una píldora de 2 px en oro claro, se ajusta a un rectángulo suave (6 px) solo en celdas anchas. La hoja se inclina entre -0.4° y -1.5° según el ancho, y el timbre a 2.5°.

### Named Rules
**The Touch Pill Rule.** Una píldora con borde se lee como botón. Lo que no se toca (los niveles de Resultado, los públicos de "Trabajamos con", los puntos de "Qué incluye") va como lista de texto con su ícono, sin borde ni fondo.

**The Thread Rule.** El hilo dorado de 1 px es el único conector de la página. Une, separa y señala; ninguna flecha, línea de puntos o borde grueso cumple ese oficio. Se dibuja de izquierda a derecha al entrar y se desvanece hacia la punta.

## Components

### Buttons
Brillo contenido: el oro se enciende al tocarlo, sin saltos.
- **Shape:** píldora (999 px), de 3.3rem de alto en la hero y hasta 4rem en Contacto.
- **Oro:** degradado de oro a oro tostado (#a9824d), letra blanca con sombra corta, 700 en mayúsculas con tracking 0.1em. Al pasar el puntero sube 2 px, un barrido de luz cruza la píldora y el halo pasa a brasa. Es siempre el primero y el único dorado de su grupo.
- **Línea:** borde de 1.5 px en hueso, fondo ceniza al 45 %. Al pasar el puntero un relleno hueso crece desde el centro y la letra pasa a ceniza.
- **Flecha:** se corre 4 px al pasar el puntero; al presionar, el botón baja a escala 0.98.
- **Variante de la barra:** "Solicitar asesoría" en caja normal y tracking 0.02em.

### Cards / Containers
- **Placa de norma:** fondo humo, borde de 1 px en hueso al 9 %, ángulo recto, un canto dorado de 1 px arriba y un hilo corto de 40 px entre el nombre y su explicación. Es la única caja con borde de la página.

### Navigation
- **Escritorio:** NEXUS a la izquierda; Servicios (con submenú), Trayectoria y Método en Schibsted 500 a 0.97rem en hueso al 90 %, con una píldora translúcida que se desliza entre ellos al pasar el puntero; banderas con 44 px de toque; el botón dorado a la derecha. Al bajar, la barra toma un velo ceniza con desenfoque y un hilo dorado inferior.
- **Submenú de Servicios:** botón de divulgación que se abre al pasar el mouse o con clic y teclado. Panel de vidrio oscuro (ceniza al 85 % con desenfoque, borde hueso al 13 %, radio 1.6rem) bajo el botón, con las tres líneas de servicio: el nombre de la línea y, debajo en gris, sus servicios. Cada línea lleva a Servicios con su primer servicio elegido (`#servicios?grupo=…`).
- **Móvil:** botón circular de 48 px; el menú se abre como un círculo que crece desde él, con los enlaces en la voz display (hasta 3.6rem), las tres líneas de servicio como subenlaces bajo Servicios, un resplandor de brasa abajo, el botón dorado a todo el ancho, y correo y teléfono como enlaces. El foco queda dentro del menú mientras está abierto.

### Título carbonizado (firma)
Cada letra tiene dos capas: la encendida (#ffe2b0 con resplandor naranja) y la carbonizada (textura de ceniza periódica sobre gris que se enfría hacia brasa apagada). La encendida brilla y se apaga mientras la carbonizada aparece debajo. Solo en la hero y en Contacto.

### Nudo y recorrido del método (firma)
Tres hilos se dibujan hasta la X dorada en Intersección. En Método, los siete pasos del método científico de NFPA 921 van en una columna vertical (en escritorio, a la derecha de la foto y las normas, que quedan fijas). Una línea dorada guiada por el scroll baja de paso en paso y enciende cada nodo. El ciclo de la norma (si una hipótesis no resiste, se vuelve a los datos) va como nota con su ícono bajo el paso 6; el hilo de retorno que lo dibujaba se quitó el 12-11.

### Hoja del informe (firma)
Papel hueso con grano fino, luz suave arriba a la izquierda y bordes apenas tostados. Membrete con NEXUS, folio en rótulo, timbre sepia en doble borde de 3 px. Las marcas se escriben solas en tres tintas: subrayado en oro tostado (sustentada), subrayado punteado en ámbar (requiere respaldo) y tachado en brasa (sin sustento suficiente), cada una con su glifo trazado a mano.

## Do's and Don'ts

### Do:
- **Do** alternar ceniza y humo entre secciones para pausar, con el ritmo vertical de clamp(5.5rem, 11vw, 9.5rem).
- **Do** acentuar una sola línea de cada título de sección en oro claro.
- **Do** conectar, separar y señalar con el hilo dorado de 1 px y sus nodos circulares.
- **Do** hacer entrar el contenido subiendo desde una máscara o desde un desenfoque de 6 px, con salida exponencial cubic-bezier(0.16, 1, 0.3, 1), y respetar el movimiento reducido.
- **Do** redondear al píxel físico todo desplazamiento continuo (parallax, seguimiento del mouse).
- **Do** prefijar con nx- las clases propias de un componente: next.config procesa todo el CSS como global, así que una clase sin prefijo choca con las demás.

### Don't:
- **Don't** usar llamas en primer plano ni rojo de alarma; el fuego es atmósfera.
- **Don't** rellenar superficies o botones con brasa, ni sumar otro color saturado.
- **Don't** usar ámbar #c08419 ni sepia #6b4f2a fuera de la hoja del informe y su leyenda.
- **Don't** crear una segunda superficie clara.
- **Don't** armar tarjetas de íconos ni filas de cifras de consultora.
- **Don't** poner el titular de otra sección en la voz de lectura; la tesis es una sola.
- **Don't** usar flechas, líneas de puntos ni bordes gruesos como conectores.
- **Don't** colocar un rótulo en mayúsculas espaciadas encima de un título.
