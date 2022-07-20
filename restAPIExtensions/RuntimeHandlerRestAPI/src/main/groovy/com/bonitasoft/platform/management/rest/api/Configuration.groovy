package com.bonitasoft.platform.management.rest.api;

import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

import org.bonitasoft.platform.configuration.ConfigurationService
import org.bonitasoft.platform.configuration.model.BonitaConfiguration
import org.bonitasoft.platform.setup.PlatformSetupAccessor
import org.bonitasoft.web.extension.ResourceProvider
import org.bonitasoft.web.extension.rest.RestAPIContext
import org.bonitasoft.web.extension.rest.RestApiController
import org.bonitasoft.web.extension.rest.RestApiResponse
import org.bonitasoft.web.extension.rest.RestApiResponseBuilder
import org.slf4j.Logger
import org.slf4j.LoggerFactory

import groovy.json.JsonBuilder

class Configuration implements RestApiController {

    private static final Logger LOGGER = LoggerFactory.getLogger(Configuration.class)

    @Override
    RestApiResponse doHandle(HttpServletRequest request, RestApiResponseBuilder responseBuilder, RestAPIContext context) {
		
		ConfigurationService configurationService;
		Map<String, Map<String,String>> globalConf = new HashMap<String, Map<String,String>>();		
		configurationService = PlatformSetupAccessor.getConfigurationService();		
		
		
		
		
		
		LOGGER.info("Retrieve platform engine configuration");
		List<BonitaConfiguration> configuration = configurationService.getPlatformEngineConf();
		Map<String, String> platformEngineConf = new HashMap<>();
		for(BonitaConfiguration conf : configuration){			
				platformEngineConf.put(conf.getResourceName(), new String(conf.getResourceContent()));
		}
		
		
		globalConf.put("platformEngineConf", platformEngineConf);

		LOGGER.info("Retrieve platform portal configuration");
		configuration = configurationService.getPlatformPortalConf();
		Map<String, String> platformPortalConf = new HashMap<>();
		for(BonitaConfiguration conf : configuration){
			platformPortalConf.put(conf.getResourceName(), new String(conf.getResourceContent()));
		}
		globalConf.put("platformPortalConf", platformPortalConf);

		// we return only the current tenant
		LOGGER.info("Retrieve current tenant engine configuration");
		configuration = configurationService.getTenantEngineConf(context.apiSession.getTenantId());
		Map<String, String> engineTenantConf = new HashMap<>();
		for(BonitaConfiguration conf : configuration){
			engineTenantConf.put(conf.getResourceName(), new String(conf.getResourceContent()));
		}
		globalConf.put("engineTenantConf", engineTenantConf);

		LOGGER.info("Retrieve current tenant portal configuration");
		configuration = configurationService.getTenantPortalConf(context.apiSession.getTenantId());
		Map<String, String> portalTenantConf = new HashMap<>();
		for(BonitaConfiguration conf : configuration){
			portalTenantConf.put(conf.getResourceName(), new String(conf.getResourceContent()));
		}
		globalConf.put("portalTenantConf", portalTenantConf);	
		
		

        // Send the result as a JSON representation
        // You may use buildPagedResponse if your result is multiple
        return buildResponse(responseBuilder, HttpServletResponse.SC_OK, new JsonBuilder(globalConf).toString())
    }

    /**
     * Build an HTTP response.
     *
     * @param  responseBuilder the Rest API response builder
     * @param  httpStatus the status of the response
     * @param  body the response body
     * @return a RestAPIResponse
     */
    RestApiResponse buildResponse(RestApiResponseBuilder responseBuilder, int httpStatus, Serializable body) {
        return responseBuilder.with {
            withResponseStatus(httpStatus)
            withResponse(body)
            build()
        }
    }

    /**
     * Returns a paged result like Bonita BPM REST APIs.
     * Build a response with a content-range.
     *
     * @param  responseBuilder the Rest API response builder
     * @param  body the response body
     * @param  p the page index
     * @param  c the number of result per page
     * @param  total the total number of results
     * @return a RestAPIResponse
     */
    RestApiResponse buildPagedResponse(RestApiResponseBuilder responseBuilder, Serializable body, int p, int c, long total) {
        return responseBuilder.with {
            withContentRange(p,c,total)
            withResponse(body)
            build()
        }
    }

    /**
     * Load a property file into a java.util.Properties
     */
    Properties loadProperties(String fileName, ResourceProvider resourceProvider) {
        Properties props = new Properties()
        resourceProvider.getResourceAsStream(fileName).withStream { InputStream s ->
            props.load s
        }
        props
    }

}
