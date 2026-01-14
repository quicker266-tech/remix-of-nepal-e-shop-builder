-- Enable subdomain routing for potato store
UPDATE stores 
SET domain_verified = true, 
    domain_type = 'subdomain' 
WHERE slug = 'potato';