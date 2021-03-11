using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ActivateDuskHighlightsOnPlatform : MonoBehaviour
{
    //Activates dusk highlites while both Dawn is in the quest zone and dusk is in the quest zone for Dusk Invisible Platform quest.
    GameObject duskMesh;
    Metadata metadata;
    bool dawnInZone = false;

    // Start is called before the first frame update
    void Start()
    {
        duskMesh = GameObject.Find("DuskMesh");
        metadata = GameObject.FindObjectOfType<Metadata>();
    }

    private void Update()
    {
        dawnInZone = GameObject.FindObjectOfType<ActivateDuskPlatformHighlights>().dawnInZone;
    }


    private void OnTriggerStay(Collider other)
    {
        
        if (other.CompareTag("Player") && other.gameObject.name == "Dusk")
        {
            
            if (dawnInZone)
            {
                // Override dusks seethrough script
                duskMesh.GetComponent<SeeThroughColor>().enabled = false;
                foreach (Material _mat in duskMesh.GetComponent<SkinnedMeshRenderer>().materials)
                {
                    _mat.SetShaderPassEnabled("Always", true);
                }
            } else {
                duskMesh.GetComponent<SeeThroughColor>().enabled = true;
            }
           
        }
    }

    private void OnTriggerExit(Collider other)
    {
        // re-enable dusks seethrough script
        duskMesh.GetComponent<SeeThroughColor>().enabled = true;
        /*        if (other.CompareTag("Player") && other.gameObject.name == "Dusk" && dawnInZone)
                {
                    foreach (Material _mat in duskMesh.GetComponent<SkinnedMeshRenderer>().materials)
                    {
                        _mat.SetShaderPassEnabled("Always", false);
                    }
                }*/
    }
}