# Ideas PR — Guía Completa de Funcionalidad

> **Versión:** Junio 2026  
> **Stack:** Next.js 15 · Prisma · Supabase · NextAuth  
> **URL producción:** https://ideaspr.vercel.app

---

## Tabla de Contenidos

1. [Estructura de Roles](#1-estructura-de-roles)
2. [Sitio Público (Landing)](#2-sitio-público-landing)
3. [Autenticación y Acceso](#3-autenticación-y-acceso)
4. [Panel Admin](#4-panel-admin)
5. [Panel Empleado](#5-panel-empleado)
6. [Panel Cliente](#6-panel-cliente)
7. [Flujo Operativo Completo](#7-flujo-operativo-completo)
8. [Funciones Transversales](#8-funciones-transversales)

---

## 1. Estructura de Roles

La app tiene **tres roles** que determinan qué páginas y acciones están disponibles:

| Rol | Ruta principal | Descripción |
|---|---|---|
| `admin` | `/admin` | Dueño / gerente. Acceso total. |
| `employee` | `/empleado` | Empleado del taller. Ve sus tareas y registra horas. |
| `client` | `/cliente` | Cliente externo. Ve sus proyectos, órdenes y facturas. |

Al iniciar sesión el sistema redirige automáticamente a la ruta correcta según el rol.

---

## 2. Sitio Público (Landing)

Accesible sin iniciar sesión en `https://ideaspr.vercel.app`.

### 2.1 Página de Inicio (`/`)
- **Hero** con imagen de portada, slogan y botón de acción.
- **Sección de servicios** con íconos y descripción breve de cada servicio (rotulación, impresión, viniles, etc.).
- **Proyectos destacados** — galería de trabajos realizados.
- **Estadísticas** (años de experiencia, proyectos completados, clientes, etc.).
- **Formulario de cotización** (`QuoteForm`) — el visitante llena nombre, email, teléfono, empresa, tipo de servicio, presupuesto, fecha límite y mensaje. Al enviar crea un registro `Quote` en la base de datos y llega una notificación al admin.
- **CTA Band** — banda de llamado a la acción.
- **Footer** con información de contacto.
- **Botón WhatsApp** flotante en esquina inferior.

### 2.2 Servicios (`/servicios`)
Lista completa de todos los servicios activos. Cada servicio tiene modal con descripción detallada e imágenes.

### 2.3 Proyectos / Portafolio (`/proyectos`)
Galería de proyectos con filtros por categoría. Cada tarjeta muestra la imagen de portada, título y descripción.

### 2.4 Nosotros (`/nosotros`)
Página informativa sobre la empresa. El contenido es editable desde el panel admin.

### 2.5 Idioma
Todo el sitio público soporta **español e inglés** (`/es/...` y `/en/...`). El selector de idioma aparece en la barra de navegación.

---

## 3. Autenticación y Acceso

### 3.1 Login (`/login`)
- Formulario de email + contraseña.
- Autenticación via **NextAuth (Auth.js)** con proveedor `Credentials`.
- Las contraseñas se almacenan con hash bcrypt.
- Al autenticarse exitosamente, redirige según el rol:
  - `admin` → `/admin`
  - `employee` → `/empleado`
  - `client` → `/cliente/proyectos`

### 3.2 Sesión
- La sesión persiste en cookie segura (JWT).
- El middleware (`src/middleware.ts`) protege todas las rutas `/admin`, `/empleado` y `/cliente` — sin sesión válida redirige a `/login`.

### 3.3 Cerrar sesión
Botón disponible en el menú lateral de todos los paneles.

---

## 4. Panel Admin

Ruta base: `/admin`  
Acceso: solo rol `admin`.

### 4.1 Dashboard (`/admin`)
Vista rápida del negocio:
- **Cotizaciones nuevas** — cuántos formularios del sitio público están sin revisar.
- **Tareas abiertas** — total de tareas que no están en "Hecha".
- **Por cobrar** — suma de facturas pendientes; destaca en rojo si hay facturas vencidas.
- **Equipo** — número de empleados y clientes activos.
- **Cobrado vs. Facturado** — porcentaje de conversión.
- **Últimas cotizaciones** — tabla de los 5 formularios más recientes con nombre, email y estado.
- **Últimos mensajes** — últimos mensajes recibidos de clientes o empleados.

---

### 4.2 Tareas de Producción (`/admin/tareas`)

El tablero de tareas estilo **Trello** — el centro operativo diario.

#### Columnas (listas)
Las columnas son configurables. Por defecto:
- **Jobs Pendientes** · **En Espera** · **Arte / Diseño** · **Producción** · **Terminaciones** · **Instalación / Entrega** · **Hecha**

El admin puede **agregar, renombrar, cambiar color y eliminar** columnas usando el menú `···` de cada lista.

#### Tarjeta de tarea
Cada tarjeta muestra:
- Imagen de portada (si aplica)
- Título de la tarea
- Etiqueta de estado y prioridad de colores
- Íconos de: descripción, adjuntos, horas estimadas, fecha límite
- Avatares de miembros asignados

#### Crear tarea
1. Clic en **+ Nueva Tarea** (barra superior) o **+ Añadir una tarjeta** al fondo de una columna.
2. Se abre el modal `TaskEditor`.
3. Campos disponibles:
   - **Título** (obligatorio)
   - **Descripción** (texto libre con formato)
   - **Estado** (columna destino)
   - **Prioridad** (Urgente / Alta / Normal / Baja)
   - **Horas estimadas**
   - **Fecha límite**
   - **Miembros** (empleados asignados a la tarea)
   - **Orden** (enlazar la tarea a una orden de trabajo de un cliente)
   - **Imagen de portada** (URL o subir archivo)
   - **Adjuntos** (archivos, imágenes)
   - **Checklist** — lista de pasos dentro de la tarea
   - **Hoja de aprobación** — diseño para enviar al cliente a aprobar
4. Clic **Guardar** — la tarjeta aparece en el tablero inmediatamente (actualización optimista).

#### Editar tarea
- Clic en cualquier tarjeta → se abre `TaskEditor` en modo edición.
- Todos los cambios se guardan en tiempo real con el botón **Guardar**.
- El historial de cambios (quién cambió qué y cuándo) se registra automáticamente.

#### Mover tarjetas
- **Arrastrar y soltar** entre columnas — el nuevo estado se guarda automáticamente en la base de datos.
- Al mover, la posición dentro de la columna también se guarda.

#### Imprimir tarea
- Botón de impresora en el header del modal de edición.
- Genera un documento HTML completo con: título, descripción, estado, prioridad, miembros, checklist, comentarios y adjuntos.
- Abre la ventana de impresión del navegador.

#### Filtros del tablero
- **Buscar** por título.
- **Por miembro** (desplegable de empleados).
- **Por prioridad** (Urgente / Alta / Normal / Baja).
- **Por fecha** (Todas / Vencidas / Esta semana).
- Botón **× Limpiar** para resetear todos los filtros.
- Los filtros se guardan en `localStorage` y persisten al recargar.

#### Vista Calendario
- Cambiar a vista calendario desde el toolbar.
- Muestra las tareas por fecha límite en un calendario mensual.

#### Archivar tareas hechas
- Botón **Archivar hechas** (esquina superior derecha).
- Archiva todas las tareas en columna "Hecha" — dejan de aparecer en el tablero sin eliminarse.

#### Comentarios y actividad
- En el modal de edición, sección **Actividad** al fondo.
- Se pueden añadir comentarios con texto y adjuntos.
- El historial de cambios (estado, prioridad, asignados, etc.) aparece automáticamente.

#### Hoja de aprobación
- Pestaña **Hoja de Aprobación** dentro del modal de edición.
- Permite crear páginas con imágenes de diseños para que el cliente apruebe.
- El cliente recibe acceso para ver y aprobar/solicitar cambios.

---

### 4.3 Proyectos de Taller (`/admin/proyectos-taller`)

Tablero Kanban para gestionar **proyectos completos** (más macro que las tareas).

#### Etapas del proyecto
Configurables. Por defecto: Intake → Estimado → Arte → Producción → Terminaciones → Entrega → Cerrado.

#### Tarjeta de proyecto
- Número de proyecto y número de estimado
- Cliente, monto cotizado, fecha límite
- Prioridad, miembros del equipo
- Contador de tareas y documentos vinculados
- Botón para ver costos reales vs. cotizado

#### Crear proyecto
- Campos: número de proyecto, número de estimado, título, descripción, prioridad, nombre del cliente, monto cotizado.

#### Mover proyecto de etapa
- Arrastrar la tarjeta **o** usar el botón de flecha → para avanzar etapa.

#### Costos del proyecto
- Clic en el ícono `$` de una tarjeta.
- Muestra: materiales usados, horas-hombre registradas, costo total vs. monto cotizado, margen estimado.

---

### 4.4 Dashboard del Presidente (`/admin/inteligencia`)

Vista ejecutiva para el dueño de la empresa:

- **Meta de ventas mensual** — barra de progreso editable con botón de lápiz.
- **Proyectos activos** — conteo.
- **Proyectos cerrados este mes**.
- **Margen estimado** — facturado menos costo real, con porcentaje.
- **Atrasados y pendientes de aprobación**.
- **Costo vs. facturación** — comparativa global: cotizado, costo real, margen.
- **Flujo por etapa** — barras horizontales con cuántos proyectos hay en cada etapa (identifica cuellos de botella).
- **Top empleados** — ranking por horas registradas.

---

### 4.5 Cotizaciones (`/admin/cotizaciones`)

Lista de todos los formularios enviados desde el sitio público:
- Nombre, email, empresa, servicio, presupuesto, fecha límite y mensaje completo.
- Estados: `nuevo`, `en revisión`, `respondido`, `cerrado`.
- Se puede cambiar el estado con un clic.

---

### 4.6 Órdenes de Trabajo (`/admin/ordenes`)

Gestión de órdenes vinculadas a clientes:
- **Número de orden** (auto-generado con prefijo).
- Cliente, título, servicio, fechas, estado, total facturado vs. pagado.
- Cada orden puede tener **tareas vinculadas** del tablero de producción.
- Estados: Nuevo / En progreso / Completado / Cancelado.

---

### 4.7 Facturas (`/admin/facturas`)

Registro de cobros a clientes:
- Número de factura, cliente (cuenta o datos directos), monto, pagado, vencimiento.
- Estados: `pendiente`, `pagada`, `vencida`, `cancelada`.
- Totales globales: facturado, cobrado, por cobrar.

---

### 4.8 Usuarios (`/admin/usuarios`)

Gestión completa de cuentas:
- **Empleados**: nombre, email, rol, teléfono, empresa, tarifa por hora, estado activo/inactivo.
- **Clientes**: nombre, email, empresa, historial de órdenes.
- **Crear** — formulario con email + contraseña temporal.
- **Editar** — cambiar nombre, rol, tarifa, avatar.
- **Desactivar** — el usuario no puede iniciar sesión pero sus datos se conservan.

---

### 4.9 Chat Interno (`/admin/chat`)

Mensajería en tiempo real entre miembros del equipo:
- **Sala general** y **mensajes directos**.
- Soporta texto, archivos adjuntos e imágenes.
- Los mensajes no leídos muestran contador de badge.
- Powered por Supabase Realtime (WebSockets).

---

### 4.10 Horarios (`/admin/horarios`)

Gestión de turnos de empleados:
- Ver/editar el horario semanal de cada empleado.
- Cada empleado puede tener múltiples turnos por día (ej. 7am–12pm y 1pm–5pm).
- Los turnos aparecen en el reloj de ponche del empleado como referencia.

---

### 4.11 Horas (`/admin/horas`)

Registro y control de horas trabajadas:
- Ver horas registradas por empleado y por tarea.
- Corregir o agregar registros manualmente.
- Vista por período (semana / mes).

---

### 4.12 Ponche (`/admin/horas` — sección ponche)

Control de asistencia:
- Historial de entradas/salidas de todos los empleados.
- Ver horas netas por día (descontando breaks).
- El admin puede crear/editar registros de ponche.

---

### 4.13 Días Libres (`/admin/dias-libres`)

Gestión de solicitudes de vacaciones y días libres:
- Los empleados solicitan un rango de fechas con motivo.
- El admin puede **aprobar** o **rechazar** con nota.
- Las solicitudes aprobadas aparecen en el calendario de horarios.

---

### 4.14 Instrucciones Diarias (`/admin/instrucciones`)

Notas y asignaciones especiales por empleado por día:
- Selector de fecha (con botones Anterior / Siguiente).
- Área de texto por cada empleado activo.
- **Auto-guardado** — mientras se escribe, se guarda automáticamente (debounce de 800ms).
- El empleado ve sus instrucciones del día en su dashboard y en la sección **Hojas** de su panel.

---

### 4.15 Calculadora de Precios (`/admin/calculadora`)

Motor de cotización rápida:
- Seleccionar **material** (D-Board, PVC, Acrílico, Banner, Vinil, etc.).
- Ingresar **ancho × alto** en pulgadas y **cantidad**.
- Agregar costo de **terminaciones** (laminado, instalación, etc.).
- **Calcular** — muestra desglose: costo de material, costo de tinta, costo base, markup, **precio final**.
- Parámetros globales editables (markup ×, costo de tinta por pie²) que afectan todos los cálculos.

---

### 4.16 Materiales (`/admin/materiales`)

Catálogo de materiales con su costo de producción:
- Nombre, categoría, grosor, costo por pie², unidad.
- Crear / editar / activar-desactivar materiales.
- Los materiales activos aparecen en la calculadora de precios.

---

### 4.17 Costos de Rol (`/admin/costos`)

Tarifa de hora-hombre por rol del taller:
- Ej.: "Artista Gráfico → $25/h", "Rotulista → $30/h", "Wrapper → $35/h".
- Estos valores alimentan el cálculo de costo real de proyectos.

---

### 4.18 Capacidad del Taller (`/admin/capacidad`)

Límites de producción diaria por proceso/máquina:
- Ej.: "Impresión D-Board 3mm → 300 planchas/día".
- Sirve para no prometer entregas que superen la capacidad real.

---

### 4.19 Auditoría (`/admin/auditoria`)

Log de todas las acciones sensibles del sistema:
- Quién hizo qué y cuándo (crear, editar, eliminar usuarios, facturas, etc.).
- Filtros por usuario, tipo de acción y rango de fechas.

---

### 4.20 Landing Builder (`/admin/landing` y `/admin/paginas`)

Editor de contenido del sitio público sin código:

#### Páginas editables:
- **Inicio** — hero, servicios, proyectos destacados, estadísticas, CTA.
- **Servicios** (`/admin/paginas/servicios`) — añadir/editar/eliminar servicios con íconos, descripción ES/EN, imágenes y galería.
- **Proyectos** (`/admin/paginas/proyectos`) — portafolio de trabajos con categorías, imágenes y descripción ES/EN.
- **Nosotros** (`/admin/paginas/nosotros`) — texto y contenido de la página about.

---

### 4.21 Configuración (`/admin/settings`)

Ajustes generales de la plataforma:
- Nombre de la empresa, teléfono, email de contacto.
- Configuraciones de apariencia y parámetros globales.

---

## 5. Panel Empleado

Ruta base: `/empleado`  
Acceso: rol `employee`.

### 5.1 Dashboard (`/empleado`)
- Saludo personalizado con el nombre del empleado.
- **Instrucciones del día** — si el admin dejó una nota para ese empleado hoy, aparece destacada en la parte superior.
- **KPIs personales**: tareas abiertas, tareas completadas, tareas urgentes, total de horas registradas (últimas 10 entradas).
- **Tabla de tareas asignadas** — lista con vencimiento, prioridad y estado.

### 5.2 Mis Tareas (`/empleado/tareas`)
- Tablero Kanban igual al del admin, pero filtrado a las tareas en las que el empleado es miembro o asignado.
- Puede crear tareas, editar sus tareas y mover tarjetas entre columnas.
- Puede **iniciar / pausar / detener** una sesión de trabajo en una tarea (botón Play/Stop en el modal).
- Las sesiones activas se muestran con un indicador visual en la tarjeta.

### 5.3 Ponche — Reloj de Entrada/Salida (`/empleado/ponche`)
- **Botón Entrada** / **Botón Salida** grande y visible.
- Al iniciar sesión muestra la hora de entrada.
- Permite registrar **breaks** (pausas).
- Muestra el horario de turno asignado por el admin como referencia.
- **Historial** — tabla de los últimos 7 días con: fecha, hora entrada, hora salida, horas trabajadas, nota.

### 5.4 Mis Horas (`/empleado/horas`)
- Registrar horas trabajadas en tareas específicas.
- Seleccionar tarea, cantidad de horas y nota.
- Ver historial de todos los registros propios.

### 5.5 Hojas — Instrucciones (`/empleado/hojas`)
- Ver las instrucciones que el admin le dejó por fecha.
- Selector de fecha para ver instrucciones de días anteriores o futuros.

### 5.6 Horario (`/empleado/horario`)
- Ver el horario de turno semanal asignado por el admin.
- Días, horas de entrada y salida, etiqueta del turno.

### 5.7 Días Libres (`/empleado/dias-libres`)
- **Solicitar** un período de días libres: rango de fechas y motivo.
- Ver el estado de solicitudes anteriores (pendiente / aprobada / rechazada).
- Ver el comentario del admin al aprobar/rechazar.

### 5.8 Perfil (`/empleado/perfil`)
- Editar nombre, teléfono y avatar.
- Cambiar contraseña.

### 5.9 Chat (`/empleado/chat`)
- Igual al del admin — sala general y mensajes directos.
- Sólo puede ver salas en las que es miembro.

---

## 6. Panel Cliente

Ruta base: `/cliente`  
Acceso: rol `client`.

### 6.1 Mis Proyectos (`/cliente/proyectos`)
Vista principal del cliente — lista de todos los proyectos asociados a su cuenta:
- Nombre del proyecto, estado actual (etapa del taller), fecha límite.
- Indicador de aprobaciones pendientes (hojas que debe revisar y firmar).
- Clic en un proyecto para ver su detalle.

### 6.2 Detalle de Proyecto
- Etapa actual del proyecto con barra de progreso visual.
- **Tareas vinculadas** — lista de tareas de producción asociadas a este proyecto.
- **Hojas de aprobación** — imágenes de diseños para que el cliente revise y:
  - ✅ **Apruebe** — el proyecto avanza.
  - 🔄 **Solicite cambios** — con nota descriptiva de qué cambiar.
- Historial de eventos del proyecto.

### 6.3 Mis Órdenes (`/cliente/ordenes`)
- Lista de todas las órdenes de trabajo.
- Número de orden, título, servicio, estado, fecha de entrega, total y pagado.
- Ver detalles de cada orden.

### 6.4 Mis Facturas (`/cliente/facturas`)
- Lista de facturas emitidas: número, monto, pagado, fecha de vencimiento, estado.
- Badge de color por estado (pendiente = amarillo, pagada = verde, vencida = rojo).

### 6.5 Mis Tareas (`/cliente/tareas`)
- Vista de las tareas de producción asociadas a sus proyectos u órdenes.
- Modo lectura — puede ver el estado, descripción y adjuntos.
- Puede revisar hojas de aprobación vinculadas a cada tarea.

### 6.6 Mensajes (`/cliente/mensajes`)
- Bandeja de mensajes con el equipo de Ideas PR.
- Puede enviar mensajes al admin.

### 6.7 Perfil (`/cliente/perfil`)
- Editar nombre, teléfono, empresa.
- Cambiar contraseña.

---

## 7. Flujo Operativo Completo

Este es el ciclo de vida típico de un trabajo desde que llega hasta que se entrega:

```
1. CLIENTE llena formulario en el sitio público
        ↓
2. ADMIN recibe notificación en Dashboard → revisa en /admin/cotizaciones
        ↓
3. ADMIN crea una Orden de Trabajo (/admin/ordenes) vinculada al cliente
        ↓
4. ADMIN crea un Proyecto de Taller (/admin/proyectos-taller) vinculado a la orden
   - Asigna número de proyecto y estimado
   - Etapa inicial: "Intake"
        ↓
5. ADMIN crea Tareas de Producción (/admin/tareas) vinculadas al proyecto
   - Columna inicial: "Jobs Pendientes" o "Arte / Diseño"
   - Asigna empleados, fecha límite, horas estimadas
        ↓
6. EMPLEADO ve sus tareas en /empleado/tareas
   - Registra entrada con Ponche (/empleado/ponche)
   - Inicia sesión de trabajo en la tarea (botón Play)
   - Mueve tarea a "En Progreso" al empezar
        ↓
7. ADMIN sube la hoja de aprobación (diseño) en el modal de la tarea
        ↓
8. CLIENTE recibe notificación → entra a /cliente/proyectos
   - Revisa el diseño en la Hoja de Aprobación
   - Aprueba o solicita cambios con nota
        ↓
9. (Si cambios) EMPLEADO ajusta el diseño → ADMIN actualiza la hoja → CLIENTE aprueba
        ↓
10. EMPLEADO mueve la tarea a "Producción" → trabaja → mueve a "Terminaciones" → "Instalación/Entrega"
        ↓
11. ADMIN mueve el Proyecto de Taller a etapa "Cerrado"
        ↓
12. ADMIN crea Factura (/admin/facturas) vinculada al cliente
        ↓
13. CLIENTE ve la factura en /cliente/facturas y paga
```

---

## 8. Funciones Transversales

Estas funciones están disponibles en varios roles y secciones:

### 8.1 Actualizaciones en Tiempo Real
- El tablero de tareas y el chat se actualizan automáticamente cuando otro usuario hace un cambio.
- Powered by **Supabase Realtime** (WebSockets). Si la conexión no está disponible, el sistema hace polling cada 15 segundos como respaldo.
- Un indicador **● N online** en la esquina inferior derecha del tablero muestra cuántos usuarios están activos.

### 8.2 Subida de Archivos
- Adjuntos en tareas, comentarios, mensajes de chat.
- Las imágenes se suben a **Supabase Storage**.
- Soporta: imágenes (JPG, PNG, WebP), PDFs y otros archivos.
- Limite de tamaño configurable.

### 8.3 Búsqueda y Filtros
- En el tablero de tareas: búsqueda por texto + filtros por miembro, prioridad y fecha.
- En todas las listas de administración: filtros por estado, fecha, usuario.

### 8.4 Internacionalización (i18n)
- El sitio público soporta **Español** e **Inglés**.
- Los paneles internos están en español.
- El idioma del sitio público se selecciona con el prefijo de URL: `/es/` o `/en/`.

### 8.5 Notificaciones
- **Badge de cotizaciones nuevas** en el dashboard del admin.
- **Badge de mensajes no leídos** en el chat.
- **Indicador de aprobaciones pendientes** en el panel del cliente.

### 8.6 Seguridad
- Todas las rutas del portal están protegidas por middleware que verifica la sesión y el rol.
- Las contraseñas se almacenan con hash bcrypt (nunca en texto plano).
- Los endpoints de API validan que el usuario tenga el rol correcto antes de ejecutar.
- Registro de auditoría de todas las acciones sensibles.

### 8.7 Rendimiento
- Las páginas del admin usan **caché de Next.js** (`unstable_cache`) con revalidación de 30 segundos.
- Las actualizaciones optimistas en el tablero de tareas reflejan cambios en la UI instantáneamente sin esperar al servidor.
- Las imágenes se sirven desde CDN de Supabase Storage.

---

## Resumen de Rutas

### Públicas
| Ruta | Descripción |
|---|---|
| `/` | Landing page principal |
| `/servicios` | Catálogo de servicios |
| `/proyectos` | Portafolio de trabajos |
| `/nosotros` | Sobre la empresa |
| `/login` | Inicio de sesión |
| `/cotizacion` | Formulario de cotización |

### Admin (`/admin/...`)
| Ruta | Descripción |
|---|---|
| `/admin` | Dashboard general |
| `/admin/tareas` | Tablero de producción (Trello) |
| `/admin/proyectos-taller` | Kanban de proyectos |
| `/admin/inteligencia` | Dashboard ejecutivo del presidente |
| `/admin/cotizaciones` | Formularios del sitio web |
| `/admin/ordenes` | Órdenes de trabajo |
| `/admin/facturas` | Gestión de cobros |
| `/admin/usuarios` | Empleados y clientes |
| `/admin/chat` | Mensajería interna |
| `/admin/horarios` | Turnos de empleados |
| `/admin/horas` | Horas registradas |
| `/admin/dias-libres` | Solicitudes de vacaciones |
| `/admin/instrucciones` | Notas diarias por empleado |
| `/admin/calculadora` | Calculadora de precios |
| `/admin/materiales` | Catálogo de materiales |
| `/admin/costos` | Tarifas por rol |
| `/admin/capacidad` | Capacidad del taller |
| `/admin/auditoria` | Log de acciones |
| `/admin/paginas` | Editor del sitio web |
| `/admin/settings` | Configuración general |

### Empleado (`/empleado/...`)
| Ruta | Descripción |
|---|---|
| `/empleado` | Dashboard personal |
| `/empleado/tareas` | Mis tareas (Kanban filtrado) |
| `/empleado/ponche` | Reloj entrada/salida |
| `/empleado/horas` | Registro de horas |
| `/empleado/hojas` | Instrucciones del admin |
| `/empleado/horario` | Mi horario de turnos |
| `/empleado/dias-libres` | Solicitar días libres |
| `/empleado/perfil` | Mi perfil |
| `/empleado/chat` | Chat interno |

### Cliente (`/cliente/...`)
| Ruta | Descripción |
|---|---|
| `/cliente/proyectos` | Mis proyectos activos |
| `/cliente/ordenes` | Mis órdenes de trabajo |
| `/cliente/facturas` | Mis facturas |
| `/cliente/tareas` | Estado de producción |
| `/cliente/mensajes` | Mensajes con Ideas PR |
| `/cliente/perfil` | Mi perfil |
