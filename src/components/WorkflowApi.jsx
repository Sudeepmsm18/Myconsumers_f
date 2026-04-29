import domo from 'ryuu.js';

const WORKFLOW_ALIAS = "kanban";

export const startWorkflow = async ({ Body, Subject, To }) => {
  try {
    const payload = {
      body: Body,
      subject: Subject,
      to: To
    };

    const instance = await domo.post(
      `/domo/workflow/v1/models/${WORKFLOW_ALIAS}/start`,
      payload,
    );

    console.log('Workflow response:', instance);
    return instance;
  } catch (error) {
    console.error('Workflow error:', error);
    throw error;
  }
};




