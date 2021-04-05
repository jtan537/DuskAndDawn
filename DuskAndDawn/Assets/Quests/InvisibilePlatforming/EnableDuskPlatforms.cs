using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EnableDuskPlatforms : MonoBehaviour
{
    // Start is called before the first frame update
    public bool enteredShowPlatformZone = false;
    private void OnTriggerEnter(Collider other)
    {
        if (other.gameObject.name == "Dusk")
        {
            
            enteredShowPlatformZone = true;

        }
        
    }
}
