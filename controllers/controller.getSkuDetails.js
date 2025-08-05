const { getSkuDetailsByCMCode, getAllSkuDetails, updateIsActiveStatus, getActiveYears, getAllSkuDescriptions, updateSkuDetailBySkuCode } = require('../models/model.getSkuDetails');
const { insertSkuDetail } = require('../models/model.insertSkuDetail');
const { getComponentDetailsByCode, insertComponentDetail, updateComponentSkuCode } = require('../models/model.componentOperations');

/**
 * Controller to get SKU details filtered by CM code
 */
async function getSkuDetailsByCMCodeController(request, reply) {
  try {
    const { cm_code } = request.params;
    
    const skuDetails = await getSkuDetailsByCMCode(cm_code);
    
    reply.code(200).send({ 
      success: true, 
      count: skuDetails.length,
      cm_code: cm_code,
      data: skuDetails 
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ 
      success: false, 
      message: 'Failed to fetch SKU details', 
      error: error.message 
    });
  }
}

/**
 * Controller to get all SKU details
 */
async function getAllSkuDetailsController(request, reply) {
  try {
    const skuDetails = await getAllSkuDetails();
    
    reply.code(200).send({ 
      success: true, 
      count: skuDetails.length,
      data: skuDetails 
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ 
      success: false, 
      message: 'Failed to fetch SKU details', 
      error: error.message 
    });
  }
}

/**
 * Controller to update is_active status for a SKU detail by id
 */
async function updateIsActiveStatusController(request, reply) {
  try {
    const { id } = request.params;
    const { is_active } = request.body;
    if (typeof is_active !== 'boolean') {
      return reply.code(400).send({ success: false, message: 'is_active must be a boolean' });
    }
    const updated = await updateIsActiveStatus(id, is_active);
    if (!updated) {
      return reply.code(404).send({ success: false, message: 'SKU detail not found' });
    }
    reply.code(200).send({ success: true, data: updated });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ success: false, message: 'Failed to update is_active status', error: error.message });
  }
}

/**
 * Controller to get unique active years (period)
 */
async function getActiveYearsController(request, reply) {
  try {
    const years = await getActiveYears();
    reply.code(200).send({ success: true, count: years.length, years });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ success: false, message: 'Failed to fetch years', error: error.message });
  }
}

/**
 * Controller to get all sku_description values with CM code and description
 */
async function getAllSkuDescriptionsController(request, reply) {
  try {
    const descriptions = await getAllSkuDescriptions();
    reply.code(200).send({ success: true, count: descriptions.length, data: descriptions });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ success: false, message: 'Failed to fetch sku descriptions', error: error.message });
  }
}

/**
 * Controller to insert a new SKU detail
 */
async function insertSkuDetailController(request, reply) {
  try {
    const {
      sku_data,
      components // Array of component objects
    } = request.body;

    // Get skutype from query parameter if provided
    const skutype = request.query.skutype || 'Default';

    // Log the incoming data from UI
    console.log('=== SKU ADDITION REQUEST DATA ===');
    console.log('Full Request Body:', JSON.stringify(request.body, null, 2));
    console.log('SKU Data:', JSON.stringify(sku_data, null, 2));
    console.log('Components Data:', JSON.stringify(components, null, 2));
    console.log('SKU Type from query:', skutype);
    console.log('=== END SKU ADDITION REQUEST DATA ===');

    // Validate required sku_data
    if (!sku_data) {
      return reply.code(400).send({ 
        success: false, 
        message: 'sku_data is required' 
      });
    }

    // Validate required fields in sku_data
    if (!sku_data.sku_code || sku_data.sku_code.trim() === '') {
      return reply.code(400).send({ success: false, message: 'A value is required for SKU code' });
    }
    if (!sku_data.sku_description || sku_data.sku_description.trim() === '') {
      return reply.code(400).send({ success: false, message: 'A value is required for SKU description' });
    }

    // Add skutype to sku_data
    sku_data.skutype = skutype;

    // Insert SKU detail
    const insertedSku = await insertSkuDetail(sku_data);
    
    // Handle component data if provided
    const componentResults = [];
    if (components && Array.isArray(components) && components.length > 0) {
      for (const component of components) {
        try {
          // Check if component_code already exists
          const existingComponent = await getComponentDetailsByCode(component.component_code);
          
          if (existingComponent) {
            // Update existing component by appending SKU code
            const updatedComponent = await updateComponentSkuCode(
              component.component_code, 
              existingComponent.sku_code, 
              sku_data.sku_code
            );
            componentResults.push({
              component_code: component.component_code,
              action: 'updated',
              data: updatedComponent
            });
          } else {
            // Insert new component
            const componentData = {
              ...component,
              sku_code: sku_data.sku_code, // Set the current SKU code
              created_by: sku_data.created_by || component.created_by,
              created_date: sku_data.created_date || component.created_date || new Date(),
              is_active: component.is_active !== undefined ? component.is_active : true
            };
            
            const insertedComponent = await insertComponentDetail(componentData);
            componentResults.push({
              component_code: component.component_code,
              action: 'inserted',
              data: insertedComponent
            });
          }
        } catch (componentError) {
          componentResults.push({
            component_code: component.component_code,
            action: 'error',
            error: componentError.message
          });
        }
      }
    }

    reply.code(201).send({ 
      success: true, 
      sku_data: insertedSku,
      components_processed: componentResults.length,
      component_results: componentResults
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ success: false, message: 'Failed to insert SKU detail', error: error.message });
  }
}

/**
 * Controller to update a SKU detail by sku_code
 */
async function updateSkuDetailBySkuCodeController(request, reply) {
  console.log('🔥 UPDATE API CALLED!');
  
  try {
    const { sku_code } = request.params;
    const { 
      sku_description, 
      sku_reference, 
      skutype, 
      site, 
      formulation_reference,
      components
    } = request.body;
    
    // Console log the data received from UI
    console.log('=== SKU UPDATE API - DATA FROM UI ===');
    console.log('SKU Code:', sku_code);
    console.log('Request Body:', JSON.stringify(request.body, null, 2));
    console.log('Components:', components);
    console.log('=== END SKU UPDATE API DATA ===');
    
    // Validation
    if (!sku_code || sku_code.trim() === '') {
      return reply.code(400).send({ success: false, message: 'A value is required for SKU code' });
    }
    
    // Check if at least one field is provided for update
    const updateFields = { sku_description, sku_reference, skutype, site, formulation_reference };
    const hasUpdateData = Object.values(updateFields).some(value => value !== undefined && value !== null);
    
    if (!hasUpdateData && (!components || components.length === 0)) {
      return reply.code(400).send({ 
        success: false, 
        message: 'At least one field must be provided for update (sku_description, sku_reference, skutype, site, formulation_reference) or components array' 
      });
    }
    
    // Update SKU detail
    const data = {};
    if (sku_description !== undefined) data.sku_description = sku_description;
    if (sku_reference !== undefined) data.sku_reference = sku_reference;
    if (skutype !== undefined) data.skutype = skutype;
    if (site !== undefined) data.site = site;
    if (formulation_reference !== undefined) data.formulation_reference = formulation_reference;
    
    const updated = await updateSkuDetailBySkuCode(sku_code, data);
    
    if (!updated) {
      return reply.code(404).send({ success: false, message: 'SKU detail not found' });
    }
    
    // Handle component updates
    let componentUpdateResults = null;
    
    if (components && Array.isArray(components) && components.length > 0) {
      // Extract component_id from the component objects
      const componentIds = components.map(comp => ({
        component_id: comp.component_id || comp.id // Handle both component_id and id
      }));
      
      console.log('Extracted Component IDs:', componentIds);
      
      // Step A: Remove SKU code from ALL components first
      const removedFromAll = await removeSkuFromAllComponentDetails(sku_code);
      
      // Step B: Add SKU code to specified components
      const addedToSpecific = await addSkuToSpecificComponents(sku_code, componentIds);
      
      componentUpdateResults = {
        removed_from_all: removedFromAll,
        added_to_specific: addedToSpecific
      };
    } else if (skutype === 'external') {
      // Special handling for external SKUs (remove from all components)
      componentUpdateResults = await removeSkuFromAllComponentDetails(sku_code);
    }
    
    reply.code(200).send({ 
      success: true, 
      data: updated,
      component_updates: componentUpdateResults
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ success: false, message: 'Failed to update SKU detail', error: error.message });
  }
}

/**
 * Remove SKU code from ALL component details (handles comma-separated values)
 */
async function removeSkuFromAllComponentDetails(skuCode) {
  try {
    const { removeSkuFromAllComponentDetails } = require('../models/model.getSkuDetails');
    const results = await removeSkuFromAllComponentDetails(skuCode);
    return {
      message: `Removed SKU code '${skuCode}' from all component details`,
      updated_components: results.length,
      details: results
    };
  } catch (error) {
    console.error('Error removing SKU from all component details:', error);
    throw error;
  }
}

/**
 * Add SKU code to specific components (handles comma-separated values)
 */
async function addSkuToSpecificComponents(skuCode, components) {
  try {
    const { addSkuToSpecificComponents } = require('../models/model.getSkuDetails');
    const results = await addSkuToSpecificComponents(skuCode, components);
    return {
      message: `Added SKU code '${skuCode}' to specified components`,
      updated_components: results.length,
      details: results
    };
  } catch (error) {
    console.error('Error adding SKU to specific components:', error);
    throw error;
  }
}

module.exports = {
  getSkuDetailsByCMCodeController,
  getAllSkuDetailsController,
  updateIsActiveStatusController,
  getActiveYearsController,
  getAllSkuDescriptionsController,
  insertSkuDetailController,
  updateSkuDetailBySkuCodeController
}; 