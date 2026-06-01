# Auditoria completa - Ideas PR Portal

## Resumen ejecutivo

Estado general del proyecto: parcialmente funcional.

El portal en produccion permite iniciar sesion con los tres roles demo y redirige a dashboards diferenciados. Las rutas principales cargan, la cotizacion publica funciona, los uploads funcionan y el build local compila correctamente.

Antes de considerarlo listo para uso real hay hallazgos criticos de seguridad y funcionamiento: credenciales demo visibles en produccion, endpoints con informacion expuesta sin sesion, acceso cruzado de admin al portal cliente, error 500 en `/admin/landing`, errores de hidratacion React en paginas publicas y una mala experiencia de logout.

Validaciones locales ejecutadas despues de aplicar correcciones:

- `npm run typecheck`: OK
- `npm run build`: OK
- `npm audit --omit=dev`: OK, 0 vulnerabilidades

## Hallazgos criticos

1. Credenciales demo visibles en produccion

La pantalla `/login` en produccion muestra credenciales demo. Esto facilita accesos no autorizados si esas cuentas tienen permisos reales.

Cambio aplicado en codigo:

- `src/app/[locale]/login/page.tsx`: se quitaron credenciales prellenadas/demo.
- `src/components/AuthModal.tsx`: se quitaron accesos demo.
- `README.md` y `.env.example`: se documento usar contrasenas privadas para seed.

2. `/api/settings` estaba publico

En produccion, una visita anonima a `/api/settings` devolvia configuracion completa. Esto puede exponer contenido interno y configuracion administrativa.

Cambio aplicado en codigo:

- `src/app/api/settings/route.ts`: `GET` ahora exige rol `admin`.

3. `/api/tareas/columns` estaba publico

En produccion, una visita anonima a `/api/tareas/columns` devolvia columnas del tablero. No es informacion altamente sensible por si sola, pero confirma estructura interna y debe requerir sesion.

Cambio aplicado en codigo:

- `src/app/api/tareas/columns/route.ts`: `GET` ahora exige sesion.

4. Admin podia entrar al portal cliente manualmente

El layout de cliente permitia `admin` y `client`. Esto mezclaba contexto de rol y permitia que un admin viera el portal como si fuera cliente, sin una funcion formal de impersonacion.

Cambio aplicado en codigo:

- `src/app/[locale]/cliente/layout.tsx`: ahora solo acepta rol `client`.

5. Endpoint de empleados exponia demasiados usuarios a empleados

En produccion, un empleado podia consultar `/api/empleados` y recibir lista de usuarios, incluyendo clientes. Para colaboracion interna, empleado solo necesita directorio interno activo.

Cambio aplicado en codigo:

- `src/app/api/empleados/route.ts`: empleados reciben solo usuarios activos con rol `admin` o `employee`, y campos limitados.

6. `/admin/landing` respondio HTTP 500 en produccion

La ruta renderiza contenido visual, pero el status HTTP observado fue 500. Esto rompe monitoreo, SEO interno y confiabilidad del editor.

Causa probable:

- Desfase entre deploy de produccion, datos guardados en `siteSetting` o runtime del editor de landing.
- El build local actual no reproduce el error.

Cambio recomendado:

- Revisar logs de Vercel para `/admin/landing`.
- Agregar error boundary especifico al editor.
- Validar y normalizar JSON de landing antes de renderizar bloques.

7. Logout invalida sesion pero deja pantalla `chrome-error://chromewebdata/`

El logout si protege la sesion despues, pero el flujo visual termina en una pantalla de error del navegador.

Cambio aplicado en codigo:

- `src/components/portal/LogoutButton.tsx`: nuevo logout client-side con `next-auth/react`.
- `src/components/portal/PortalShell.tsx`: usa el nuevo boton en vez de server action dentro del sidebar.

8. Errores de hidratacion React en paginas publicas

Produccion mostro errores `Minified React error #418` en consola. Esto indica HTML distinto entre servidor y cliente.

Cambio recomendado:

- Reproducir con build local en modo produccion.
- Revisar componentes publicos con datos dependientes del cliente, fechas, contenido HTML editable o media dinámica.
- Priorizar `LandingRenderer` y bloques de landing.

## Hallazgos importantes

- El portal funciona por rol, pero varias secciones demo estan vacias o con datos de prueba. Para uso real se necesita poblar datos reales y ocultar cualquier marca "Demo".
- El menu cliente solo muestra `Mis tareas` y `Mi perfil`, pero existen rutas de cliente para ordenes, facturas y mensajes. Esto crea navegacion incompleta.
- Algunas peticiones `.mp4` de Supabase Storage aparecen como `ERR_ABORTED`. Puede ser cancelacion normal de video, pero debe verificarse si algun media queda en blanco.
- Hay 3 enlaces sin texto accesible detectados en auditoria automatizada. Probablemente iconos o enlaces flotantes.
- Falta una capa RBAC centralizada para APIs; algunas rutas estan protegidas una por una.
- No se observaron vulnerabilidades npm de produccion, pero las dependencias deben mantenerse actualizadas.

## Mejoras recomendadas

- Centralizar autorizacion con helpers por rol para APIs y layouts.
- Agregar middleware o guards server-side para rutas protegidas.
- Implementar tests E2E con Playwright para login, logout y acceso cruzado por rol.
- Agregar rate limiting en login, registro, cotizacion y uploads.
- Agregar auditoria de acciones administrativas: crear, editar, borrar usuarios, facturas, ordenes y landing.
- Agregar validacion de tamano, tipo y ownership en uploads.
- Agregar estados vacios mas especificos por rol y seccion.
- Agregar alertas de error y retry en formularios que dependen de APIs.
- Revisar metadata SEO por pagina, Open Graph y sitemap.

## Pruebas por rol

| Rol | Login funciona | Dashboard correcto | Permisos correctos | Bugs encontrados | Recomendacion |
|---|---:|---:|---:|---|---|
| Admin | Si | Si, `/admin` | Parcial | Puede entrar a rutas cliente en produccion; `/admin/landing` HTTP 500; logout con pantalla de error | Corregido acceso cliente y logout en codigo local. Revisar logs Vercel para landing |
| Empleado | Si | Si, `/empleado` | Parcial | `/api/empleados` exponia clientes y mas usuarios de los necesarios | Corregido endpoint para devolver solo directorio interno activo |
| Cliente | Si | Si, `/cliente/tareas` | Parcial | Endpoints publicos `/api/settings` y `/api/tareas/columns` afectaban a todos; navegacion cliente incompleta | Corregidos endpoints. Agregar links cliente visibles si esas secciones van a usarse |

## Pruebas por seccion

| Seccion | Funciona | Problema | Prioridad | Solucion sugerida |
|---|---:|---|---|---|
| Home publica | Si | Errores React #418 en consola | Alta | Revisar hidratacion en bloques publicos |
| Servicios | Si | Mismo riesgo de hidratacion | Alta | Validar contenido editable y render cliente/servidor |
| Proyectos | Si | Mismo riesgo de hidratacion | Alta | Validar bloques e imagenes |
| Nosotros | Si | Mismo riesgo de hidratacion | Alta | Validar bloques e imagenes |
| Login | Si | Credenciales demo visibles en produccion | Critica | Ya removido en codigo local |
| Admin dashboard | Si | Datos demo visibles | Media | Sustituir seed demo por datos reales |
| Admin landing | Parcial | HTTP 500 en produccion | Critica | Revisar logs, validar JSON, agregar error boundary |
| Admin usuarios | Si | Requiere politicas claras de alta/baja | Media | Auditoria de acciones y confirmaciones |
| Tareas | Si | Columnas eran publicas por API | Critica | Ya protegido en codigo local |
| Cotizaciones | Si | Cotizacion publica crea registro correctamente | Media | Rate limit, captcha opcional y notificaciones |
| Facturas | Parcial | Demo sin datos utiles para algunos roles | Media | Cargar datos reales y validar ownership |
| Ordenes | Parcial | Demo sin datos utiles para algunos roles | Media | Cargar datos reales y validar ownership |
| Chat | Si | Verificar aislamiento de rooms por rol/cliente | Alta | Tests E2E y pruebas de API por ownership |
| Ponche/horas | Si | Debe auditarse integridad de cambios de horario | Media | Logs y aprobaciones |
| Uploads | Si | Upload de prueba funciono | Media | Validar MIME, tamano, ownership y retencion |
| Logout | Parcial | Saca la sesion, pero redireccion visual falla | Alta | Ya cambiado a logout client-side local |

## Seguridad

Checklist:

- Autenticacion por credenciales: OK, funciona para admin, empleado y cliente.
- Usuarios inactivos bloqueados: OK en codigo local con validacion `active`.
- Rutas protegidas por layout: Parcial, se corrigio cliente para solo `client`.
- APIs protegidas por rol: Parcial, se corrigieron `settings`, `tareas/columns` y exposicion de `empleados`.
- Tokens/sesion: Usa Auth.js. Revisar configuracion final de `AUTH_SECRET`, cookies seguras y HTTPS en Vercel.
- Credenciales demo expuestas: Fallo en produccion, removido del codigo local.
- Datos sensibles en frontend: Parcial. Verificar que no haya claves privadas en bundles ni `.env` publicado.
- Cliente ve solo sus datos: Necesita tests E2E y revision API por API.
- Empleado sin acceso admin: OK por pruebas de rutas, pero APIs internas requieren auditoria continua.
- Admin con acceso correcto: OK, salvo acceso cruzado a cliente ya corregido localmente.
- Uploads: Funciona, pero requiere politicas estrictas de tipo/tamano/ownership.
- Realtime: Configurado localmente para refrescar tablero/chat/ponche; verificar variables Supabase en Vercel.

## UX/UI

- No se detecto overflow horizontal en movil, tablet ni desktop durante pruebas.
- El estilo visual general es consistente y mantiene la identidad oscura/dorada.
- Login debe quedar limpio, sin credenciales demo visibles.
- Logout necesita volver a home o login de forma limpia; corregido localmente.
- Cliente necesita navegacion visible a todas las secciones que realmente existan: ordenes, facturas y mensajes, o eliminar esas rutas si no se usaran.
- Agregar `aria-label` a enlaces icon-only o flotantes.
- Revisar foco visible en botones de accion, menus y formularios.
- Agregar mensajes de error mas especificos en formularios y estados vacios por rol.

## Performance y SEO

- Build local de Next.js compila correctamente.
- First Load JS compartido aproximado: 102 kB segun build local.
- Paginas publicas tienen revalidacion de 1 minuto.
- Corregir errores de hidratacion React antes de campanas o uso real.
- Agregar metadata por pagina: titulo, descripcion, Open Graph, imagen social y canonical.
- Optimizar videos/imagenes de Supabase: poster, preload adecuado, fallback y formatos comprimidos.
- Verificar redirects y dominio canonico en Vercel.
- Agregar monitoreo de errores runtime en Vercel o Sentry.

## Plan de accion priorizado

### Urgente

- Desplegar los cambios locales de seguridad: login sin demo, `/api/settings` admin-only, `/api/tareas/columns` con sesion, cliente solo rol client, endpoint empleados limitado.
- Revisar logs Vercel de `/admin/landing` y corregir la causa del HTTP 500.
- Confirmar que `AUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL`, Supabase keys y credenciales seed no sean demo en produccion.
- Rotar credenciales demo si el portal quedara publico con datos reales.
- Reproducir y corregir React hydration error #418.

### Esta semana

- Crear suite Playwright: login/logout, rutas cruzadas, APIs por rol, cotizacion, upload y CRUD basico.
- Agregar rate limiting en login, registro, cotizaciones y uploads.
- Agregar auditoria de acciones administrativas.
- Completar menu cliente o retirar rutas no usadas.
- Agregar error boundaries y toasts consistentes en paneles internos.

### Proxima version

- RBAC centralizado por permisos, no solo por rol.
- Impersonacion formal de cliente para admin, con aviso visual y logs, si el negocio lo necesita.
- Dashboard de salud: errores recientes, cotizaciones nuevas, uploads fallidos y actividad por rol.
- Metadata SEO completa, sitemap, Open Graph y medicion Web Vitals.
- Politicas de retencion y limpieza de archivos subidos.

## Cambios ya implementados en el repo local

- `src/auth.ts`: bloquea login de usuarios inactivos.
- `src/app/[locale]/login/page.tsx`: elimina credenciales demo visibles.
- `src/components/AuthModal.tsx`: elimina botones/demo login.
- `src/app/api/settings/route.ts`: protege settings para admin.
- `src/app/api/tareas/columns/route.ts`: exige sesion.
- `src/app/[locale]/cliente/layout.tsx`: restringe portal cliente a rol client.
- `src/app/api/empleados/route.ts`: limita directorio para empleados.
- `src/components/portal/LogoutButton.tsx`: logout client-side.
- `src/components/portal/PortalShell.tsx`: usa logout corregido y refresco realtime.
- `src/lib/realtime.ts`, `src/components/portal/PortalRealtime.tsx`: soporte de refresco realtime.
- `src/components/portal/TaskBoard.tsx`, `ChatShell.tsx`, `PunchClock.tsx`: refrescan ante eventos realtime.
- `scripts/supabase-enable-realtime.sql`: script para habilitar tablas en `supabase_realtime`.
- `.env.example`, `prisma/seed.ts`, `README.md`: documentacion y seed orientados a contrasenas privadas.

