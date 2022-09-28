/**
 * Import own modules
 */
const kubernetes = require('../../modules/kubernetes');
const lockout = require('../../modules/lockout');
const webhook = require('../../modules/webhook');
const slack = require('../../modules/slack');
const email = require('../../modules/email');

/**
 * Define global variables
 */
const auth_header = process.env.AUTH_HEADER || false;
const custom_webhook = process.env.CUSTOM_WEBHOOK || false;
const slack_webhook = process.env.SLACK_WEBHOOK || false;
const email_smtp_host = process.env.EMAIL_SMTP_HOST || false;

/**
 * Exports all action controller endpoints
 *
 * @param app
 */
module.exports = (app) => {
    /**
     * POST /update - Deployment Update
     */
    app.post('/update', async (req, res) => {
        if(!lockout(auth_header ? req.get(auth_header) : 'Anonymous', req.body.service_name)) {
            kubernetes.createEvent({
                type: 'attempt_update',
                username: auth_header ? req.get(auth_header) : 'Anonymous',
                service: req.body.service_name,
                parameters: {},
                time: new Date().getTime()
            });

            if(custom_webhook) {
                const webhooks = custom_webhook.split(',');
                for(let item = 0; item < webhooks.length; item++) {
                    webhook(webhooks[item], {
                        type: 'attempt_update',
                        username: auth_header ? req.get(auth_header) : 'Anonymous',
                        service: req.body.service_name,
                        params: {},
                        time: new Date().getTime()
                    });
                }
            }

            if(slack_webhook) {
                slack({
                    fallback: `Attempt to update the ${req.body.service_name} deployment during lockout days/hours\n\n---`,
                    text: `Attempt to update the ${req.body.service_name} deployment during lockout days/hours\n\n---`,
                    color: 'danger',
                    fields: [
                        {
                            title: 'User',
                            value: auth_header ? req.get(auth_header) : 'Anonymous',
                            short: false
                        },
                        {
                            title: 'Deployment',
                            value: req.body.service_name,
                            short: false
                        }
                    ]
                });
            }

            if(email_smtp_host) {
                const title = `Ship: Attempt to update the ${req.body.service_name} deployment during lockout days/hours`;
                const message = `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Ship: Attempt to update the ${req.body.service_name} deployment during lockout days/hours</p><br/><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>User:</b> ${auth_header ? req.get(auth_header) : 'Anonymous'}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Deployment:</b> ${req.body.service_name}</p>`;
                email(title, message);
            }

            res.redirect(encodeURI(`/deployment/${req.body.service_name}?error=Unable to update deployment during lockout days/hours!`));
            return;
        }

        kubernetes.createEvent({
            type: 'update',
            username: auth_header ? req.get(auth_header) : 'Anonymous',
            service: req.body.service_name,
            parameters: {
                image: req.body.service_image,
                old_image_version: req.body.service_old_image_version,
                new_image_version: req.body.service_new_image_version
            },
            time: new Date().getTime()
        });

        if(custom_webhook) {
            const webhooks = custom_webhook.split(',');
            for(let item = 0; item < webhooks.length; item++) {
                webhook(webhooks[item], {
                    type: 'update',
                    username: auth_header ? req.get(auth_header) : 'Anonymous',
                    service: req.body.service_name,
                    params: {
                        image: req.body.service_image,
                        old_image_version: req.body.service_old_image_version,
                        new_image_version: req.body.service_new_image_version
                    },
                    time: new Date().getTime()
                });
            }
        }

        if(slack_webhook) {
            slack({
                fallback: `Updated the ${req.body.service_name} deployment image from ${req.body.service_image}:${req.body.service_old_image_version} to ${req.body.service_image}:${req.body.service_new_image_version}\n\n---`,
                text: `Updated the ${req.body.service_name} deployment image from ${req.body.service_image}:${req.body.service_old_image_version} to ${req.body.service_image}:${req.body.service_new_image_version}\n\n---`,
                color: 'good',
                fields: [
                    {
                        title: 'User',
                        value: auth_header ? req.get(auth_header) : 'Anonymous',
                        short: false
                    },
                    {
                        title: 'Deployment',
                        value: req.body.service_name,
                        short: false
                    },
                    {
                        title: 'Current Image',
                        value: `${req.body.service_image}:${req.body.service_old_image_version}`,
                        short: false
                    },
                    {
                        title: 'New Image',
                        value: `${req.body.service_image}:${req.body.service_new_image_version}`,
                        short: false
                    }
                ]
            });
        }

        if(email_smtp_host) {
            const title = `Ship: Updated the ${req.body.service_name} deployment image from ${req.body.service_image}:${req.body.service_old_image_version} to ${req.body.service_image}:${req.body.service_new_image_version}`;
            const message = `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Ship: Updated the ${req.body.service_name} deployment image from ${req.body.service_image}:${req.body.service_old_image_version} to ${req.body.service_image}:${req.body.service_new_image_version}</p><br/><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>User:</b> ${auth_header ? req.get(auth_header) : 'Anonymous'}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Deployment:</b> ${req.body.service_name}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Current Image:</b> ${req.body.service_image}:${req.body.service_old_image_version}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;"><b>New Image:</b> ${req.body.service_image}:${req.body.service_new_image_version}</p>`;
            email(title, message);
        }

        await kubernetes.updateDeployment(req.body.service_name.split('/')[0], req.body.service_name.split('/')[1], req.body.service_image, req.body.service_new_image_version);
        res.redirect(encodeURI(`/deployment/${req.body.service_name}?message=Successfully updated the ${req.body.service_name} deployment!`));
    });

    /**
     * POST /force_update - Deployment Force Update
     */
    app.post('/force_update', async (req, res) => {
        if(!lockout(auth_header ? req.get(auth_header) : 'Anonymous', req.body.service_name)) {
            kubernetes.createEvent({
                type: 'attempt_force_update',
                username: auth_header ? req.get(auth_header) : 'Anonymous',
                service: req.body.service_name,
                parameters: {},
                time: new Date().getTime()
            });

            if(custom_webhook) {
                const webhooks = custom_webhook.split(',');
                for(let item = 0; item < webhooks.length; item++) {
                    webhook(webhooks[item], {
                        type: 'attempt_force_update',
                        username: auth_header ? req.get(auth_header) : 'Anonymous',
                        service: req.body.service_name,
                        params: {},
                        time: new Date().getTime()
                    });
                }
            }

            if(slack_webhook) {
                slack({
                    fallback: `Attempt to force re-deploy the ${req.body.service_name} deployment during lockout days/hours\n\n---`,
                    text: `Attempt to force re-deploy the ${req.body.service_name} deployment during lockout days/hours\n\n---`,
                    color: 'danger',
                    fields: [
                        {
                            title: 'User',
                            value: auth_header ? req.get(auth_header) : 'Anonymous',
                            short: false
                        },
                        {
                            title: 'Deployment',
                            value: req.body.service_name,
                            short: false
                        }
                    ]
                });
            }

            if(email_smtp_host) {
                const title = `Ship: Attempt to force re-deploy the ${req.body.service_name} deployment during lockout days/hours`;
                const message = `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Ship: Attempt to force re-deploy the ${req.body.service_name} deployment during lockout days/hours</p><br/><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>User:</b> ${auth_header ? req.get(auth_header) : 'Anonymous'}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Deployment:</b> ${req.body.service_name}</p>`;
                email(title, message);
            }

            res.redirect(encodeURI(`/deployment/${req.body.service_name}?error=Unable to force re-deploy deployment during lockout days/hours!`));
            return;
        }

        kubernetes.createEvent({
            type: 'force_update',
            username: auth_header ? req.get(auth_header) : 'Anonymous',
            service: req.body.service_name,
            parameters: {},
            time: new Date().getTime()
        });

        if(custom_webhook) {
            const webhooks = custom_webhook.split(',');
            for(let item = 0; item < webhooks.length; item++) {
                webhook(webhooks[item], {
                    type: 'force_update',
                    username: auth_header ? req.get(auth_header) : 'Anonymous',
                    service: req.body.service_name,
                    params: {},
                    time: new Date().getTime()
                });
            }
        }

        if(slack_webhook) {
            slack({
                fallback: `Force re-deployed the ${req.body.service_name} deployment\n\n---`,
                text: `Force re-deployed the ${req.body.service_name} deployment\n\n---`,
                color: 'good',
                fields: [
                    {
                        title: 'User',
                        value: auth_header ? req.get(auth_header) : 'Anonymous',
                        short: false
                    },
                    {
                        title: 'Deployment',
                        value: req.body.service_name,
                        short: false
                    }
                ]
            });
        }

        if(email_smtp_host) {
            const title = `Ship: Force re-deployed the ${req.body.service_name} deployment`;
            const message = `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Ship: Force re-deployed the ${req.body.service_name} deployment</p><br/><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>User:</b> ${auth_header ? req.get(auth_header) : 'Anonymous'}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Deployment:</b> ${req.body.service_name}</p>`;
            email(title, message);
        }

        await kubernetes.updateDeploymentForce(req.body.service_name.split('/')[0], req.body.service_name.split('/')[1]);
        res.redirect(encodeURI(`/deployment/${req.body.service_name}?message=Successfully force updated the ${req.body.service_name} deployment!`));
    });

    /**
     * POST /scale - Deployment Scale
     */
    app.post('/scale', async (req, res) => {
        if(!lockout(auth_header ? req.get(auth_header) : 'Anonymous', req.body.service_name)) {
            kubernetes.createEvent({
                type: 'attempt_scale',
                username: auth_header ? req.get(auth_header) : 'Anonymous',
                service: req.body.service_name,
                parameters: {},
                time: new Date().getTime()
            });

            if(custom_webhook) {
                const webhooks = custom_webhook.split(',');
                for(let item = 0; item < webhooks.length; item++) {
                    webhook(webhooks[item], {
                        type: 'attempt_scale',
                        username: auth_header ? req.get(auth_header) : 'Anonymous',
                        service: req.body.service_name,
                        params: {},
                        time: new Date().getTime()
                    });
                }
            }

            if(slack_webhook) {
                slack({
                    fallback: `Attempt to scale the ${req.body.service_name} deployment during lockout days/hours\n\n---`,
                    text: `Attempt to scale the ${req.body.service_name} deployment during lockout days/hours\n\n---`,
                    color: 'danger',
                    fields: [
                        {
                            title: 'User',
                            value: auth_header ? req.get(auth_header) : 'Anonymous',
                            short: false
                        },
                        {
                            title: 'Deployment',
                            value: req.body.service_name,
                            short: false
                        }
                    ]
                });
            }

            if(email_smtp_host) {
                const title = `Ship: Attempt to scale the ${req.body.service_name} deployment during lockout days/hours`;
                const message = `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Ship: Attempt to scale the ${req.body.service_name} deployment during lockout days/hours</p><br/><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>User:</b> ${auth_header ? req.get(auth_header) : 'Anonymous'}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Deployment:</b> ${req.body.service_name}</p>`;
                email(title, message);
            }

            res.redirect(encodeURI(`/deployment/${req.body.service_name}?error=Unable to scale deployment during lockout days/hours!`));
            return;
        }

        kubernetes.createEvent({
            type: 'scale',
            username: auth_header ? req.get(auth_header) : 'Anonymous',
            service: req.body.service_name,
            parameters: {
                scale: req.body.service_scale
            },
            time: new Date().getTime()
        });

        if(custom_webhook) {
            const webhooks = custom_webhook.split(',');
            for(let item = 0; item < webhooks.length; item++) {
                webhook(webhooks[item], {
                    type: 'scale',
                    username: auth_header ? req.get(auth_header) : 'Anonymous',
                    service: req.body.service_name,
                    params: {
                        scale: req.body.service_scale
                    },
                    time: new Date().getTime()
                });
            }
        }

        if(slack_webhook) {
            slack({
                fallback: `Scaled the ${req.body.service_name} deployment to ${req.body.service_scale} container(s)\n\n---`,
                text: `Scaled the ${req.body.service_name} deployment to ${req.body.service_scale} container(s)\n\n---`,
                color: 'good',
                fields: [
                    {
                        title: 'User',
                        value: auth_header ? req.get(auth_header) : 'Anonymous',
                        short: false
                    },
                    {
                        title: 'Deployment',
                        value: req.body.service_name,
                        short: false
                    },
                    {
                        title: 'Scale',
                        value: req.body.service_scale,
                        short: false
                    }
                ]
            });
        }

        if(email_smtp_host) {
            const title = `Ship: Scaled the ${req.body.service_name} deployment to ${req.body.service_scale} container(s)`;
            const message = `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Ship: Scaled the ${req.body.service_name} deployment to ${req.body.service_scale} container(s)</p><br/><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>User:</b> ${auth_header ? req.get(auth_header) : 'Anonymous'}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Deployment:</b> ${req.body.service_name}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Scale:</b> ${req.body.service_scale}</p>`;
            email(title, message);
        }

        await kubernetes.updateDeploymentScale(req.body.service_name.split('/')[0], req.body.service_name.split('/')[1], req.body.service_scale);
        res.redirect(encodeURI(`/deployment/${req.body.service_name}?message=Successfully scaled the ${req.body.service_name} deployment!`));
    });
}
