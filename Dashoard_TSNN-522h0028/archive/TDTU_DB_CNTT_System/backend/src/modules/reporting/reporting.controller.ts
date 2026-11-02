import { widgetRegistry } from './widget-registry.ts';
import { chartRouter } from './chart-router.ts';
import { sendSuccess, sendError } from '../../core/response.ts';
import type { RouteHandler } from '../../core/types.ts';

export const listWidgetsHandler: RouteHandler = (_req, res) => {
  try {
    const widgets = widgetRegistry.listWidgets();
    sendSuccess(res, { widgets, total: widgets.length }, 'Danh sách widget biểu đồ khả dụng');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy danh sách widget');
  }
};

export const dispatchChartHandler: RouteHandler = async (req, res) => {
  try {
    const { widgetId, options } = req.body || {};
    if (!widgetId) {
      sendError(res, 400, 'Mã widgetId là bắt buộc', 'WIDGET_ID_REQUIRED');
      return;
    }

    const payload = await chartRouter.dispatch(widgetId, options || {});
    sendSuccess(res, payload, `Dữ liệu biểu đồ [${widgetId}]`);
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi định tuyến biểu đồ');
  }
};

export const getChartByIdHandler: RouteHandler = async (req, res) => {
  try {
    const { widgetId } = req.params;
    const payload = await chartRouter.dispatch(widgetId, req.query || {});
    sendSuccess(res, payload, `Dữ liệu biểu đồ [${widgetId}]`);
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi tạo dữ liệu biểu đồ');
  }
};
